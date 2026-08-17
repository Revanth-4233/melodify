package com.musicinsights.service;

import com.musicinsights.entity.CachedSong;
import com.musicinsights.entity.Playlist;
import com.musicinsights.entity.PlaylistSong;
import com.musicinsights.repository.CachedSongRepository;
import com.musicinsights.repository.PlaylistRepository;
import com.musicinsights.repository.PlaylistSongRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RecommendationService {

    private final PlaylistRepository playlistRepository;
    private final PlaylistSongRepository playlistSongRepository;
    private final ItunesProxyService itunesProxyService;
    private final SongCacheService songCacheService;
    private final CachedSongRepository cachedSongRepository;

    public RecommendationService(PlaylistRepository playlistRepository,
                                 PlaylistSongRepository playlistSongRepository,
                                 ItunesProxyService itunesProxyService,
                                 SongCacheService songCacheService,
                                 CachedSongRepository cachedSongRepository) {
        this.playlistRepository = playlistRepository;
        this.playlistSongRepository = playlistSongRepository;
        this.itunesProxyService = itunesProxyService;
        this.songCacheService = songCacheService;
        this.cachedSongRepository = cachedSongRepository;
    }

    public List<CachedSong> getRecommendations() {
        Set<String> targetQueries = new LinkedHashSet<>();
        
        // Check Liked Songs or curated playlists to find user's preferred artists
        Optional<Playlist> likedOpt = playlistRepository.findByTitle("Liked Songs");
        if (likedOpt.isPresent()) {
            List<PlaylistSong> likedSongs = playlistSongRepository.findByPlaylistIdOrderByOrderIndexAsc(likedOpt.get().getId());
            for (PlaylistSong ps : likedSongs) {
                if (ps.getCachedSong() != null && ps.getCachedSong().getArtistName() != null) {
                    targetQueries.add(ps.getCachedSong().getArtistName() + " latest hits");
                }
            }
        }

        // Fallback default queries if user hasn't liked many songs yet
        if (targetQueries.isEmpty()) {
            targetQueries.add("Anirudh Ravichander hits");
            targetQueries.add("Sid Sriram top songs");
            targetQueries.add("Thaman S latest");
            targetQueries.add("A.R. Rahman hits");
        }

        List<CachedSong> recommendations = new ArrayList<>();
        Set<Long> seenIds = new HashSet<>();

        for (String query : targetQueries) {
            if (recommendations.size() >= 30) break;

            Map<String, Object> searchResponse = itunesProxyService.search(query, 15, "song");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> results = (List<Map<String, Object>>) searchResponse.get("results");

            if (results != null) {
                for (Map<String, Object> trackData : results) {
                    if (recommendations.size() >= 30) break;
                    
                    String trackName = (String) trackData.getOrDefault("trackName", "");
                    if (trackName.toLowerCase().contains("karaoke") || trackName.toLowerCase().contains("cover")) {
                        continue;
                    }

                    CachedSong cachedSong = songCacheService.cacheAppleMusicTrack(trackData);
                    if (cachedSong != null && seenIds.add(cachedSong.getAppleCatalogId())) {
                        recommendations.add(cachedSong);
                    }
                }
            }
        }

        return recommendations;
    }
}
