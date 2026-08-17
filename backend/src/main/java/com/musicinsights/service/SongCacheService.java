package com.musicinsights.service;

import com.musicinsights.entity.CachedSong;
import com.musicinsights.repository.CachedSongRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
public class SongCacheService {

    private final CachedSongRepository cachedSongRepository;

    public SongCacheService(CachedSongRepository cachedSongRepository) {
        this.cachedSongRepository = cachedSongRepository;
    }

    /**
     * Upgrade iTunes artwork URL to high resolution (500x500).
     * iTunes URLs end with patterns like "100x100bb.jpg" — we replace that
     * to get the original movie/album poster at a much higher resolution.
     */
    private String upgradeArtworkUrl(String url) {
        if (url == null || url.isEmpty()) return url;
        return url.replaceAll("\\d+x\\d+bb", "500x500bb");
    }

    public synchronized CachedSong cacheAppleMusicTrack(Map<String, Object> trackData) {
        if (!"track".equals(trackData.get("wrapperType"))) {
            return null;
        }

        Object trackIdObj = trackData.get("trackId");
        if (trackIdObj == null || "0".equals(trackIdObj.toString())) {
            trackIdObj = trackData.get("appleCatalogId");
        }

        Long trackId;
        if (trackIdObj instanceof Number && ((Number) trackIdObj).longValue() != 0) {
            trackId = ((Number) trackIdObj).longValue();
        } else if (trackIdObj != null && !"0".equals(trackIdObj.toString()) && !trackIdObj.toString().isEmpty()) {
            try {
                trackId = Long.parseLong(trackIdObj.toString());
            } catch (Exception e) {
                String nameStr = (String) trackData.get("trackName");
                if (nameStr == null) nameStr = "unknown";
                trackId = (long) Math.abs((nameStr + "" + trackData.get("artistName")).hashCode());
            }
        } else {
            String nameStr = (String) trackData.get("trackName");
            if (nameStr == null) nameStr = "unknown";
            trackId = (long) Math.abs((nameStr + "" + trackData.get("artistName")).hashCode());
        }

        // Deduplication: Return existing if already cached, but refresh artwork
        Optional<CachedSong> existing = cachedSongRepository.findById(trackId);
        if (existing.isPresent()) {
            CachedSong song = existing.get();
            // Refresh artwork to high-res if it's still the old low-res URL
            String newArt100 = upgradeArtworkUrl((String) trackData.get("artworkUrl100"));
            if (newArt100 != null && !newArt100.equals(song.getArtworkUrl100())) {
                song.setArtworkUrl100(newArt100);
                song.setArtworkUrl60(upgradeArtworkUrl((String) trackData.get("artworkUrl60")));
                cachedSongRepository.save(song);
            }
            return song;
        }
        
        CachedSong song = new CachedSong();
        song.setAppleCatalogId(trackId);
        
        String trackName = (String) trackData.get("trackName");
        String genre = (String) trackData.get("primaryGenreName");
        
        // Ensure language is visibly distinct for multi-language movies
        if (genre != null && (genre.equalsIgnoreCase("Telugu") || genre.equalsIgnoreCase("Tamil") || genre.equalsIgnoreCase("Hindi") || genre.equalsIgnoreCase("Malayalam") || genre.equalsIgnoreCase("Kannada"))) {
            if (!trackName.toUpperCase().contains(genre.toUpperCase())) {
                trackName = trackName + " (" + genre + ")";
            }
        }
        
        song.setTrackName(trackName);
        song.setArtistName((String) trackData.get("artistName"));
        song.setPreviewUrl((String) trackData.get("previewUrl"));
        // Store high-resolution artwork (500x500) — shows the correct movie poster
        song.setArtworkUrl100(upgradeArtworkUrl((String) trackData.get("artworkUrl100")));
        song.setArtworkUrl60(upgradeArtworkUrl((String) trackData.get("artworkUrl60")));
        song.setGenre(genre);
        song.setReleaseDate((String) trackData.get("releaseDate"));
        
        Object timeObj = trackData.get("trackTimeMillis");
        if (timeObj instanceof Number) {
            song.setTrackTimeMillis(((Number) timeObj).longValue());
        }

        song.setCachedAt(LocalDateTime.now());
        
        try {
            return cachedSongRepository.save(song);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Another thread just inserted this exact song. Fetch it instead of crashing.
            return cachedSongRepository.findById(trackId).orElse(song);
        }
    }
}
