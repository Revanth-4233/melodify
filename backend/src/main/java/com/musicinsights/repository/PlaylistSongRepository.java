package com.musicinsights.repository;

import com.musicinsights.entity.PlaylistSong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaylistSongRepository extends JpaRepository<PlaylistSong, Long> {
    List<PlaylistSong> findByPlaylistIdOrderByOrderIndexAsc(Long playlistId);
    void deleteByPlaylistId(Long playlistId);
}
