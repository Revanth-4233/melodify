package com.musicinsights.service;

import com.musicinsights.entity.CachedSong;
import com.musicinsights.entity.Playlist;
import com.musicinsights.entity.PlaylistSong;
import com.musicinsights.repository.PlaylistRepository;
import com.musicinsights.repository.PlaylistSongRepository;
import com.musicinsights.repository.PlayEventRepository;
import com.musicinsights.repository.CachedSongRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class PlaylistManagerService {

    private static final Logger log = LoggerFactory.getLogger(PlaylistManagerService.class);

    private final PlaylistRepository playlistRepository;
    private final PlaylistSongRepository playlistSongRepository;
    private final PlayEventRepository playEventRepository;
    private final ItunesProxyService itunesProxyService;
    private final SongCacheService songCacheService;
    private final CachedSongRepository cachedSongRepository;

    public PlaylistManagerService(PlaylistRepository playlistRepository,
                                  PlaylistSongRepository playlistSongRepository,
                                  PlayEventRepository playEventRepository,
                                  ItunesProxyService itunesProxyService,
                                  SongCacheService songCacheService,
                                  CachedSongRepository cachedSongRepository) {
        this.playlistRepository = playlistRepository;
        this.playlistSongRepository = playlistSongRepository;
        this.playEventRepository = playEventRepository;
        this.itunesProxyService = itunesProxyService;
        this.songCacheService = songCacheService;
        this.cachedSongRepository = cachedSongRepository;
    }

    @Transactional
    public Playlist createOrUpdateCuratedPlaylist(String title, String queryTag) {
        Playlist playlist = playlistRepository.findByTitle(title).orElseGet(() -> {
            Playlist p = new Playlist();
            p.setTitle(title);
            p.setType("CURATED");
            return p;
        });
        playlist.setQueryTag(queryTag);
        playlist.setUpdatedAt(LocalDateTime.now());
        playlistRepository.save(playlist);

        // Fetch tracks from API, getting 100 to allow filtering
        Map<String, Object> searchResponse = itunesProxyService.search(queryTag, 100, "song");
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> results = (List<Map<String, Object>>) searchResponse.get("results");
        
        if (results != null) {
            playlistSongRepository.deleteByPlaylistId(playlist.getId());
            int order = 1;
            Set<Long> seenIds = new HashSet<>();
            Map<String, Integer> albumCounts = new HashMap<>();
            
            for (Map<String, Object> trackData : results) {
                if (order > 100) break; // Increased to 100 tracks max
                
                String collectionName = (String) trackData.getOrDefault("collectionName", "Unknown Album");
                String trackName = (String) trackData.getOrDefault("trackName", "");
                
                // Skip karaoke or cover versions
                if (trackName.toLowerCase().contains("karaoke") || trackName.toLowerCase().contains("cover")) {
                    continue;
                }
                
                // Skip generic compilation albums that ruin artwork
                String collectionLower = collectionName.toLowerCase();
                if (collectionLower.contains("hits") || collectionLower.contains("compilation") 
                    || collectionLower.contains("daily") || collectionLower.contains("top ") 
                    || collectionLower.contains("best of")) {
                    continue;
                }

                // Max 4 songs from the same album/movie to ensure varied artwork!
                int count = albumCounts.getOrDefault(collectionName, 0);
                if (count >= 4) continue;
                
                CachedSong cachedSong = songCacheService.cacheAppleMusicTrack(trackData);
                if (cachedSong != null && seenIds.add(cachedSong.getAppleCatalogId())) {
                    albumCounts.put(collectionName, count + 1);
                    PlaylistSong ps = new PlaylistSong();
                    ps.setPlaylist(playlist);
                    ps.setCachedSong(cachedSong);
                    ps.setOrderIndex(order++);
                    playlistSongRepository.save(ps);
                }
            }
            log.info("Saved {} songs into Playlist '{}'", seenIds.size(), title);
        }
        return playlist;
    }

    // Runs every 3 hours
    @Scheduled(fixedRate = 10800000, initialDelay = 60000)
    @Transactional
    public void generateTrendingPlaylist() {
        log.info("Starting scheduled task: Generating Trending Now playlist...");
        
        Playlist trending = playlistRepository.findByTitle("Trending Now India").orElseGet(() -> {
            Playlist p = new Playlist();
            p.setTitle("Trending Now India");
            p.setType("TRENDING_AUTO");
            return p;
        });
        trending.setUpdatedAt(LocalDateTime.now());
        playlistRepository.save(trending);

        // Get top played songs in the last 48 hours
        LocalDateTime since = LocalDateTime.now().minusHours(48);
        List<Object[]> topPlays = playEventRepository.findTopTrendingSongs(since, PageRequest.of(0, 100)); // Increased to 100

        playlistSongRepository.deleteByPlaylistId(trending.getId());
        int order = 1;
        Set<Long> seenIds = new HashSet<>();

        // First, add top played songs from history
        for (Object[] row : topPlays) {
            if (order > 100) break;
            Long songId = (Long) row[0];
            Optional<CachedSong> optSong = cachedSongRepository.findById(songId);
            if (optSong.isPresent() && seenIds.add(songId)) {
                PlaylistSong ps = new PlaylistSong();
                ps.setPlaylist(trending);
                ps.setCachedSong(optSong.get());
                ps.setOrderIndex(order++);
                playlistSongRepository.save(ps);
            }
        }

        // Always fill the remaining slots up to 100 tracks with trending hits from API
        if (order <= 100) {
            Map<String, Object> searchResponse = itunesProxyService.search("latest telugu tamil hits 2026", 150, "song");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> results = (List<Map<String, Object>>) searchResponse.get("results");
            
            if (results != null) {
                for (Map<String, Object> trackData : results) {
                    if (order > 100) break;
                    
                    String trackName = (String) trackData.getOrDefault("trackName", "");
                    if (trackName.toLowerCase().contains("karaoke") || trackName.toLowerCase().contains("cover")) {
                        continue;
                    }

                    CachedSong cachedSong = songCacheService.cacheAppleMusicTrack(trackData);
                    if (cachedSong != null && seenIds.add(cachedSong.getAppleCatalogId())) {
                        PlaylistSong ps = new PlaylistSong();
                        ps.setPlaylist(trending);
                        ps.setCachedSong(cachedSong);
                        ps.setOrderIndex(order++);
                        playlistSongRepository.save(ps);
                    }
                }
            }
        }
        
        log.info("Trending playlist generated with {} tracks.", seenIds.size());
    }

    // Runs every 24 hours
    @Scheduled(fixedRate = 86400000, initialDelay = 120000)
    @Transactional
    public void generateNewReleasesPlaylist() {
        log.info("Starting scheduled task: Generating New Releases playlist...");
        
        Playlist newReleases = playlistRepository.findByTitle("New Releases \uD83D\uDD25").orElseGet(() -> {
            Playlist p = new Playlist();
            p.setTitle("New Releases \uD83D\uDD25");
            p.setType("TRENDING_AUTO");
            return p;
        });
        newReleases.setUpdatedAt(LocalDateTime.now());
        playlistRepository.save(newReleases);

        // Fetch 200 tracks and sort by release date to find the absolute newest ones
        Map<String, Object> searchResponse = itunesProxyService.search("latest telugu songs", 200, "song");
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> results = (List<Map<String, Object>>) searchResponse.get("results");
        
        if (results != null) {
            // Sort by releaseDate descending (newest first)
            results.sort((a, b) -> {
                String dateA = (String) a.getOrDefault("releaseDate", "");
                String dateB = (String) b.getOrDefault("releaseDate", "");
                return dateB.compareTo(dateA);
            });

            playlistSongRepository.deleteByPlaylistId(newReleases.getId());
            int order = 1;
            Set<Long> seenIds = new HashSet<>();
            Map<String, Integer> albumCounts = new HashMap<>();
            
            for (Map<String, Object> trackData : results) {
                if (order > 100) break; // Limit to Top 100 new releases
                
                String collectionName = (String) trackData.getOrDefault("collectionName", "Unknown Album");
                String trackName = (String) trackData.getOrDefault("trackName", "");
                
                if (trackName.toLowerCase().contains("karaoke") || trackName.toLowerCase().contains("cover")) {
                    continue;
                }

                // Skip generic compilation albums that ruin artwork
                String collectionLower = collectionName.toLowerCase();
                if (collectionLower.contains("hits") || collectionLower.contains("compilation") 
                    || collectionLower.contains("daily") || collectionLower.contains("top ") 
                    || collectionLower.contains("best of")) {
                    continue;
                }

                // Max 4 songs per album to ensure varied new releases
                int count = albumCounts.getOrDefault(collectionName, 0);
                if (count >= 4) continue;
                
                CachedSong cachedSong = songCacheService.cacheAppleMusicTrack(trackData);
                if (cachedSong != null && seenIds.add(cachedSong.getAppleCatalogId())) {
                    albumCounts.put(collectionName, count + 1);
                    PlaylistSong ps = new PlaylistSong();
                    ps.setPlaylist(newReleases);
                    ps.setCachedSong(cachedSong);
                    ps.setOrderIndex(order++);
                    playlistSongRepository.save(ps);
                }
            }
            log.info("New Releases playlist generated with {} fresh tracks.", seenIds.size());
        }
    }
}
