package com.musicinsights.repository;

import com.musicinsights.entity.PlayEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PlayEventRepository extends JpaRepository<PlayEvent, Long> {
    
    // For velocity trending: count plays by song ID in the last N hours
    @Query("SELECT p.cachedSongId, COUNT(p) as playCount FROM PlayEvent p WHERE p.playedAt >= :since GROUP BY p.cachedSongId ORDER BY playCount DESC")
    List<Object[]> findTopTrendingSongs(@Param("since") LocalDateTime since, Pageable pageable);
}
