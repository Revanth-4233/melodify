package com.musicinsights.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(indexes = {
    @Index(name = "idx_play_event_song_time", columnList = "cachedSongId, playedAt")
})
public class PlayEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Reference to the user who played the song
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // We store the catalog ID here to join with CachedSong later
    private Long cachedSongId;

    private LocalDateTime playedAt;

    public PlayEvent() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Long getCachedSongId() {
        return cachedSongId;
    }

    public void setCachedSongId(Long cachedSongId) {
        this.cachedSongId = cachedSongId;
    }

    public LocalDateTime getPlayedAt() {
        return playedAt;
    }

    public void setPlayedAt(LocalDateTime playedAt) {
        this.playedAt = playedAt;
    }
}
