package com.musicinsights.repository;

import com.musicinsights.entity.CachedSong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CachedSongRepository extends JpaRepository<CachedSong, Long> {
}
