package com.musicplatform.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "library_albums", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "apple_catalog_id"})
})
public class LibraryAlbum {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "apple_catalog_id", nullable = false)
    private Long appleCatalogId;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(name = "artist_name", nullable = false, length = 500)
    private String artistName;

    @Column(length = 100)
    private String genre;

    @Column(name = "release_date")
    private LocalDateTime releaseDate;

    @Column(name = "track_count")
    private Integer trackCount;

    @Column(name = "artwork_url", length = 1000)
    private String artworkUrl;

    @Column(name = "collection_price", precision = 10, scale = 2)
    private BigDecimal collectionPrice;

    @Column(name = "user_rating")
    private Integer userRating;

    @Column(name = "user_notes", columnDefinition = "TEXT")
    private String userNotes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public LibraryAlbum() {}

    public LibraryAlbum(Long id, Long userId, Long appleCatalogId, String title, String artistName,
                        String genre, LocalDateTime releaseDate, Integer trackCount, String artworkUrl,
                        BigDecimal collectionPrice, Integer userRating, String userNotes,
                        LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.appleCatalogId = appleCatalogId;
        this.title = title;
        this.artistName = artistName;
        this.genre = genre;
        this.releaseDate = releaseDate;
        this.trackCount = trackCount;
        this.artworkUrl = artworkUrl;
        this.collectionPrice = collectionPrice;
        this.userRating = userRating;
        this.userNotes = userNotes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getAppleCatalogId() { return appleCatalogId; }
    public void setAppleCatalogId(Long appleCatalogId) { this.appleCatalogId = appleCatalogId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getArtistName() { return artistName; }
    public void setArtistName(String artistName) { this.artistName = artistName; }
    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }
    public LocalDateTime getReleaseDate() { return releaseDate; }
    public void setReleaseDate(LocalDateTime releaseDate) { this.releaseDate = releaseDate; }
    public Integer getTrackCount() { return trackCount; }
    public void setTrackCount(Integer trackCount) { this.trackCount = trackCount; }
    public String getArtworkUrl() { return artworkUrl; }
    public void setArtworkUrl(String artworkUrl) { this.artworkUrl = artworkUrl; }
    public BigDecimal getCollectionPrice() { return collectionPrice; }
    public void setCollectionPrice(BigDecimal collectionPrice) { this.collectionPrice = collectionPrice; }
    public Integer getUserRating() { return userRating; }
    public void setUserRating(Integer userRating) { this.userRating = userRating; }
    public String getUserNotes() { return userNotes; }
    public void setUserNotes(String userNotes) { this.userNotes = userNotes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Builder
    public static LibraryAlbumBuilder builder() { return new LibraryAlbumBuilder(); }

    public static class LibraryAlbumBuilder {
        private Long id, userId, appleCatalogId;
        private String title, artistName, genre, artworkUrl, userNotes;
        private LocalDateTime releaseDate, createdAt, updatedAt;
        private Integer trackCount, userRating;
        private BigDecimal collectionPrice;

        public LibraryAlbumBuilder id(Long id) { this.id = id; return this; }
        public LibraryAlbumBuilder userId(Long userId) { this.userId = userId; return this; }
        public LibraryAlbumBuilder appleCatalogId(Long appleCatalogId) { this.appleCatalogId = appleCatalogId; return this; }
        public LibraryAlbumBuilder title(String title) { this.title = title; return this; }
        public LibraryAlbumBuilder artistName(String artistName) { this.artistName = artistName; return this; }
        public LibraryAlbumBuilder genre(String genre) { this.genre = genre; return this; }
        public LibraryAlbumBuilder releaseDate(LocalDateTime releaseDate) { this.releaseDate = releaseDate; return this; }
        public LibraryAlbumBuilder trackCount(Integer trackCount) { this.trackCount = trackCount; return this; }
        public LibraryAlbumBuilder artworkUrl(String artworkUrl) { this.artworkUrl = artworkUrl; return this; }
        public LibraryAlbumBuilder collectionPrice(BigDecimal collectionPrice) { this.collectionPrice = collectionPrice; return this; }
        public LibraryAlbumBuilder userRating(Integer userRating) { this.userRating = userRating; return this; }
        public LibraryAlbumBuilder userNotes(String userNotes) { this.userNotes = userNotes; return this; }
        public LibraryAlbumBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public LibraryAlbumBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public LibraryAlbum build() {
            return new LibraryAlbum(id, userId, appleCatalogId, title, artistName, genre,
                    releaseDate, trackCount, artworkUrl, collectionPrice, userRating, userNotes,
                    createdAt, updatedAt);
        }
    }
}
