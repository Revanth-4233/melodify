package com.musicinsights.service;

import com.musicinsights.dto.AnalyticsResponse;
import com.musicinsights.entity.LibraryItem;
import com.musicinsights.entity.User;
import com.musicinsights.repository.LibraryItemRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final LibraryItemRepository libraryItemRepository;

    public AnalyticsService(LibraryItemRepository libraryItemRepository) {
        this.libraryItemRepository = libraryItemRepository;
    }

    public AnalyticsResponse getAnalytics(User user) {
        AnalyticsResponse response = new AnalyticsResponse();

        // Total albums
        long totalAlbums = libraryItemRepository.countByUser(user);
        response.setTotalAlbums(totalAlbums);

        // Average rating
        Double avgRating = libraryItemRepository.averageRatingForUser(user);
        response.setAverageRating(avgRating != null ? Math.round(avgRating * 100.0) / 100.0 : null);

        // Genre distribution
        List<Object[]> genreData = libraryItemRepository.countByGenreForUser(user);
        Map<String, Long> genreDistribution = new LinkedHashMap<>();
        for (Object[] row : genreData) {
            genreDistribution.put((String) row[0], (Long) row[1]);
        }
        response.setGenreDistribution(genreDistribution);

        // Top genre
        if (!genreDistribution.isEmpty()) {
            response.setTopGenre(genreDistribution.entrySet().iterator().next().getKey());
        }

        // Artist distribution
        List<Object[]> artistData = libraryItemRepository.countByArtistForUser(user);
        Map<String, Long> artistDistribution = new LinkedHashMap<>();
        int artistCount = 0;
        for (Object[] row : artistData) {
            if (artistCount >= 10) break; // Top 10 artists
            artistDistribution.put((String) row[0], (Long) row[1]);
            artistCount++;
        }
        response.setArtistDistribution(artistDistribution);

        // Top artist
        if (!artistDistribution.isEmpty()) {
            response.setTopArtist(artistDistribution.entrySet().iterator().next().getKey());
        }

        // Rating distribution
        List<Object[]> ratingData = libraryItemRepository.countByRatingForUser(user);
        Map<Integer, Long> ratingDistribution = new LinkedHashMap<>();
        // Initialize all ratings 1-5
        for (int i = 1; i <= 5; i++) {
            ratingDistribution.put(i, 0L);
        }
        for (Object[] row : ratingData) {
            ratingDistribution.put((Integer) row[0], (Long) row[1]);
        }
        response.setRatingDistribution(ratingDistribution);

        // Year distribution (releases by year)
        List<LibraryItem> allItems = libraryItemRepository.findByUser(user);
        Map<String, Long> yearDistribution = allItems.stream()
                .filter(item -> item.getReleaseDate() != null && item.getReleaseDate().length() >= 4)
                .collect(Collectors.groupingBy(
                        item -> item.getReleaseDate().substring(0, 4),
                        TreeMap::new,
                        Collectors.counting()
                ));
        response.setYearDistribution(yearDistribution);

        // Top decade
        if (!yearDistribution.isEmpty()) {
            Map<String, Long> decadeDistribution = allItems.stream()
                    .filter(item -> item.getReleaseDate() != null && item.getReleaseDate().length() >= 4)
                    .collect(Collectors.groupingBy(
                            item -> {
                                String year = item.getReleaseDate().substring(0, 4);
                                int y = Integer.parseInt(year);
                                int decade = (y / 10) * 10;
                                return decade + "s";
                            },
                            Collectors.counting()
                    ));
            response.setTopDecade(
                    decadeDistribution.entrySet().stream()
                            .max(Map.Entry.comparingByValue())
                            .map(Map.Entry::getKey)
                            .orElse(null)
            );
        }

        return response;
    }
}
