package com.musicinsights.controller;

import com.musicinsights.entity.Playlist;
import com.musicinsights.repository.PlaylistRepository;
import com.musicinsights.repository.PlaylistSongRepository;
import com.musicinsights.entity.PlaylistSong;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import com.musicinsights.service.SongCacheService;
import com.musicinsights.entity.CachedSong;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {

    private final PlaylistRepository playlistRepository;
    private final PlaylistSongRepository playlistSongRepository;
    private final SongCacheService songCacheService;

    public PlaylistController(PlaylistRepository playlistRepository, PlaylistSongRepository playlistSongRepository, SongCacheService songCacheService) {
        this.playlistRepository = playlistRepository;
        this.playlistSongRepository = playlistSongRepository;
        this.songCacheService = songCacheService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllPlaylists() {
        List<Playlist> playlists = playlistRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Playlist p : playlists) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("title", p.getTitle());
            map.put("type", p.getType());
            map.put("queryTag", p.getQueryTag());
            
            List<PlaylistSong> pSongs = playlistSongRepository.findByPlaylistIdOrderByOrderIndexAsc(p.getId());
            List<Map<String, Object>> tracks = new ArrayList<>();
            List<String> artworks = new ArrayList<>();
            
            for (PlaylistSong ps : pSongs) {
                if (ps.getCachedSong() != null) {
                    Map<String, Object> t = new HashMap<>();
                    t.put("trackId", ps.getCachedSong().getAppleCatalogId());
                    t.put("trackName", ps.getCachedSong().getTrackName());
                    t.put("artistName", ps.getCachedSong().getArtistName());
                    t.put("artworkUrl100", ps.getCachedSong().getArtworkUrl100());
                    t.put("previewUrl", ps.getCachedSong().getPreviewUrl());
                    tracks.add(t);
                    
                    if (artworks.size() < 4) {
                        artworks.add(ps.getCachedSong().getArtworkUrl100());
                    }
                }
            }
            map.put("tracks", tracks);
            map.put("artworks", artworks);
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/liked")
    public ResponseEntity<Map<String, Object>> addLikedSong(@RequestBody Map<String, Object> trackData) {
        Playlist likedPlaylist = playlistRepository.findByTitle("Liked Songs").orElseGet(() -> {
            Playlist p = new Playlist();
            p.setTitle("Liked Songs");
            p.setType("CURATED");
            return playlistRepository.save(p);
        });
        
        // Ensure required fields exist for caching
        if (!trackData.containsKey("wrapperType") || trackData.get("wrapperType") == null) {
            trackData.put("wrapperType", "track");
        }
        if ((!trackData.containsKey("trackId") || trackData.get("trackId") == null) && trackData.containsKey("appleCatalogId")) {
            trackData.put("trackId", trackData.get("appleCatalogId"));
        }
        
        CachedSong cachedSong = songCacheService.cacheAppleMusicTrack(trackData);
        if (cachedSong != null) {
            long count = playlistSongRepository.findByPlaylistIdOrderByOrderIndexAsc(likedPlaylist.getId())
                            .stream().filter(ps -> ps.getCachedSong() != null && ps.getCachedSong().getAppleCatalogId().equals(cachedSong.getAppleCatalogId()))
                            .count();
            if (count == 0) {
                PlaylistSong ps = new PlaylistSong();
                ps.setPlaylist(likedPlaylist);
                ps.setCachedSong(cachedSong);
                ps.setOrderIndex((int) (System.currentTimeMillis() % 10000));
                playlistSongRepository.save(ps);
            }
        }
        
        List<PlaylistSong> allLiked = playlistSongRepository.findByPlaylistIdOrderByOrderIndexAsc(likedPlaylist.getId());
        return ResponseEntity.ok(Map.of("message", "Added to Liked Songs", "totalLiked", allLiked.size()));
    }

    @DeleteMapping("/liked/{trackId}")
    public ResponseEntity<Map<String, String>> removeLikedSong(@PathVariable Long trackId) {
        Optional<Playlist> likedOpt = playlistRepository.findByTitle("Liked Songs");
        if (likedOpt.isPresent()) {
            List<PlaylistSong> songs = playlistSongRepository.findByPlaylistIdOrderByOrderIndexAsc(likedOpt.get().getId());
            for (PlaylistSong ps : songs) {
                if (ps.getCachedSong() != null && ps.getCachedSong().getAppleCatalogId().equals(trackId)) {
                    playlistSongRepository.delete(ps);
                    break;
                }
            }
        }
        return ResponseEntity.ok(Map.of("message", "Removed from Liked Songs"));
    }

    @PostMapping("/{playlistId}/songs")
    public ResponseEntity<Map<String, Object>> addSongToPlaylist(@PathVariable Long playlistId, @RequestBody Map<String, Object> trackData) {
        Optional<Playlist> targetOpt = playlistRepository.findById(playlistId);
        if (targetOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Playlist not found"));
        }
        Playlist targetPlaylist = targetOpt.get();

        if (!trackData.containsKey("wrapperType") || trackData.get("wrapperType") == null) {
            trackData.put("wrapperType", "track");
        }
        if ((!trackData.containsKey("trackId") || trackData.get("trackId") == null) && trackData.containsKey("appleCatalogId")) {
            trackData.put("trackId", trackData.get("appleCatalogId"));
        }

        CachedSong cachedSong = songCacheService.cacheAppleMusicTrack(trackData);
        if (cachedSong != null) {
            long count = playlistSongRepository.findByPlaylistIdOrderByOrderIndexAsc(targetPlaylist.getId())
                            .stream().filter(ps -> ps.getCachedSong() != null && ps.getCachedSong().getAppleCatalogId().equals(cachedSong.getAppleCatalogId()))
                            .count();
            if (count == 0) {
                PlaylistSong ps = new PlaylistSong();
                ps.setPlaylist(targetPlaylist);
                ps.setCachedSong(cachedSong);
                ps.setOrderIndex((int) (System.currentTimeMillis() % 10000));
                playlistSongRepository.save(ps);
            }
        }
        return ResponseEntity.ok(Map.of("message", "Song added to " + targetPlaylist.getTitle()));
    }
}
