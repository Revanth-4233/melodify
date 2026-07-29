package com.musicplatform.repository;

import com.musicplatform.model.LibraryAlbum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LibraryAlbumRepository extends JpaRepository<LibraryAlbum, Long> {

    Page<LibraryAlbum> findByUserId(Long userId, Pageable pageable);

    List<LibraryAlbum> findByUserId(Long userId);

    Optional<LibraryAlbum> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndAppleCatalogId(Long userId, Long appleCatalogId);

    long countByUserId(Long userId);

    // Analytics queries
    @Query("SELECT la.genre, COUNT(la) FROM LibraryAlbum la WHERE la.userId = :userId AND la.genre IS NOT NULL GROUP BY la.genre ORDER BY COUNT(la) DESC")
    List<Object[]> countByGenre(@Param("userId") Long userId);

    @Query("SELECT FUNCTION('YEAR', la.releaseDate), COUNT(la) FROM LibraryAlbum la WHERE la.userId = :userId AND la.releaseDate IS NOT NULL GROUP BY FUNCTION('YEAR', la.releaseDate) ORDER BY FUNCTION('YEAR', la.releaseDate)")
    List<Object[]> countByReleaseYear(@Param("userId") Long userId);

    @Query("SELECT la.userRating, COUNT(la) FROM LibraryAlbum la WHERE la.userId = :userId AND la.userRating IS NOT NULL GROUP BY la.userRating ORDER BY la.userRating")
    List<Object[]> countByRating(@Param("userId") Long userId);

    @Query("SELECT la.artistName, COUNT(la) FROM LibraryAlbum la WHERE la.userId = :userId GROUP BY la.artistName ORDER BY COUNT(la) DESC")
    List<Object[]> countByArtist(@Param("userId") Long userId);

    @Query("SELECT FUNCTION('YEAR', la.createdAt), FUNCTION('MONTH', la.createdAt), COUNT(la) FROM LibraryAlbum la WHERE la.userId = :userId GROUP BY FUNCTION('YEAR', la.createdAt), FUNCTION('MONTH', la.createdAt) ORDER BY FUNCTION('YEAR', la.createdAt), FUNCTION('MONTH', la.createdAt)")
    List<Object[]> countByCreatedMonth(@Param("userId") Long userId);

    @Query("SELECT AVG(la.userRating) FROM LibraryAlbum la WHERE la.userId = :userId AND la.userRating IS NOT NULL")
    Double averageRating(@Param("userId") Long userId);

    @Query("SELECT COUNT(DISTINCT la.artistName) FROM LibraryAlbum la WHERE la.userId = :userId")
    int countDistinctArtists(@Param("userId") Long userId);

    @Query("SELECT COUNT(DISTINCT la.genre) FROM LibraryAlbum la WHERE la.userId = :userId AND la.genre IS NOT NULL")
    int countDistinctGenres(@Param("userId") Long userId);
}
