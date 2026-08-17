package com.musicinsights.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import java.time.LocalDateTime;

@Entity
public class CachedSong {

    @Id
    private Long appleCatalogId;

    private String trackName;
    private String artistName;
    
    @Column(length = 1000)
    private String previewUrl;
    
    @Column(length = 1000)
    private String artworkUrl100;
    
    @Column(length = 1000)
    private String artworkUrl60;

    private String genre;
    private String releaseDate;
    private Long trackTimeMillis;
    
    private LocalDateTime cachedAt;

    public CachedSong() {
    }

    public Long getAppleCatalogId() {
        return appleCatalogId;
    }

    public void setAppleCatalogId(Long appleCatalogId) {
        this.appleCatalogId = appleCatalogId;
    }

    public String getTrackName() {
        return trackName;
    }

    public void setTrackName(String trackName) {
        this.trackName = trackName;
    }

    public String getArtistName() {
        return artistName;
    }

    public void setArtistName(String artistName) {
        this.artistName = artistName;
    }

    public String getPreviewUrl() {
        return previewUrl;
    }

    public void setPreviewUrl(String previewUrl) {
        this.previewUrl = previewUrl;
    }

    public String getArtworkUrl100() {
        return artworkUrl100;
    }

    public void setArtworkUrl100(String artworkUrl100) {
        this.artworkUrl100 = artworkUrl100;
    }

    public String getArtworkUrl60() {
        return artworkUrl60;
    }

    public void setArtworkUrl60(String artworkUrl60) {
        this.artworkUrl60 = artworkUrl60;
    }

    public String getGenre() {
        return genre;
    }

    public void setGenre(String genre) {
        this.genre = genre;
    }

    public String getReleaseDate() {
        return releaseDate;
    }

    public void setReleaseDate(String releaseDate) {
        this.releaseDate = releaseDate;
    }

    public Long getTrackTimeMillis() {
        return trackTimeMillis;
    }

    public void setTrackTimeMillis(Long trackTimeMillis) {
        this.trackTimeMillis = trackTimeMillis;
    }

    public LocalDateTime getCachedAt() {
        return cachedAt;
    }

    public void setCachedAt(LocalDateTime cachedAt) {
        this.cachedAt = cachedAt;
    }
}
