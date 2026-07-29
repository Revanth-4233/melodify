package com.musicplatform.service;

import com.musicplatform.dto.AnalyticsResponse;
import com.musicplatform.repository.LibraryAlbumRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final LibraryAlbumRepository repository;

    public AnalyticsService(LibraryAlbumRepository repository) {
        this.repository = repository;
    }

    public AnalyticsResponse getAnalytics(Long userId) {
        long totalAlbums = repository.countByUserId(userId);
        int totalArtists = repository.countDistinctArtists(userId);
        int totalGenres = repository.countDistinctGenres(userId);
        Double avgRating = repository.averageRating(userId);

        // Calculate total value
        BigDecimal totalValue = repository.findByUserId(userId).stream()
                .filter(a -> a.getCollectionPrice() != null)
                .map(a -> a.getCollectionPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Genre distribution (Pie/Donut chart)
        List<AnalyticsResponse.ChartData> genreDistribution = repository.countByGenre(userId).stream()
                .map(row -> AnalyticsResponse.ChartData.builder()
                        .label((String) row[0])
                        .value((Long) row[1])
                        .build())
                .collect(Collectors.toList());

        // Releases by year (Bar chart)
        List<AnalyticsResponse.ChartData> releasesByYear = repository.countByReleaseYear(userId).stream()
                .map(row -> AnalyticsResponse.ChartData.builder()
                        .label(String.valueOf(row[0]))
                        .value((Long) row[1])
                        .build())
                .collect(Collectors.toList());

        // Rating distribution (Histogram)
        List<AnalyticsResponse.ChartData> ratingDistribution = repository.countByRating(userId).stream()
                .map(row -> AnalyticsResponse.ChartData.builder()
                        .label(row[0] + " Star" + (((Number) row[0]).intValue() != 1 ? "s" : ""))
                        .value((Long) row[1])
                        .build())
                .collect(Collectors.toList());

        // Top artists (Horizontal bar chart) - limit to top 10
        List<AnalyticsResponse.ChartData> topArtists = repository.countByArtist(userId).stream()
                .limit(10)
                .map(row -> AnalyticsResponse.ChartData.builder()
                        .label((String) row[0])
                        .value((Long) row[1])
                        .build())
                .collect(Collectors.toList());

        // Library growth (Line chart)
        List<AnalyticsResponse.ChartData> libraryGrowth = repository.countByCreatedMonth(userId).stream()
                .map(row -> {
                    String monthLabel = String.format("%d-%02d", ((Number) row[0]).intValue(), ((Number) row[1]).intValue());
                    return AnalyticsResponse.ChartData.builder()
                            .label(monthLabel)
                            .value((Long) row[2])
                            .build();
                })
                .collect(Collectors.toList());

        return AnalyticsResponse.builder()
                .totalAlbums((int) totalAlbums)
                .totalArtists(totalArtists)
                .totalGenres(totalGenres)
                .averageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0)
                .totalValue(totalValue)
                .genreDistribution(genreDistribution)
                .releasesByYear(releasesByYear)
                .ratingDistribution(ratingDistribution)
                .topArtists(topArtists)
                .libraryGrowth(libraryGrowth)
                .build();
    }
}
