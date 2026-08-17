package com.musicinsights.repository;

import com.musicinsights.entity.LibraryItem;
import com.musicinsights.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LibraryItemRepository extends JpaRepository<LibraryItem, Long> {

    Page<LibraryItem> findByUser(User user, Pageable pageable);

    List<LibraryItem> findByUser(User user);

    Optional<LibraryItem> findByIdAndUser(Long id, User user);

    boolean existsByUserAndAppleCatalogId(User user, Long appleCatalogId);

    List<LibraryItem> findByUserAndAppleCatalogIdIn(User user, List<Long> appleCatalogIds);

    @Query("SELECT li.genre, COUNT(li) FROM LibraryItem li WHERE li.user = :user GROUP BY li.genre ORDER BY COUNT(li) DESC")
    List<Object[]> countByGenreForUser(@Param("user") User user);

    @Query("SELECT li.artistName, COUNT(li) FROM LibraryItem li WHERE li.user = :user GROUP BY li.artistName ORDER BY COUNT(li) DESC")
    List<Object[]> countByArtistForUser(@Param("user") User user);

    @Query("SELECT li.userRating, COUNT(li) FROM LibraryItem li WHERE li.user = :user AND li.userRating IS NOT NULL GROUP BY li.userRating ORDER BY li.userRating")
    List<Object[]> countByRatingForUser(@Param("user") User user);

    @Query("SELECT AVG(li.userRating) FROM LibraryItem li WHERE li.user = :user AND li.userRating IS NOT NULL")
    Double averageRatingForUser(@Param("user") User user);

    long countByUser(User user);
}
