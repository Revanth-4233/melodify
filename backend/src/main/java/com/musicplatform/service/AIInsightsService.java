package com.musicplatform.service;

import com.musicplatform.dto.AIInsightsResponse;
import com.musicplatform.model.LibraryAlbum;
import com.musicplatform.repository.LibraryAlbumRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AIInsightsService {

    private final LibraryAlbumRepository repository;

    // Genre similarity map for recommendations
    private static final Map<String, List<String>> GENRE_RECOMMENDATIONS = new HashMap<>() {{
        put("Alternative", Arrays.asList("Indie Rock", "Shoegaze", "Post-Punk", "Dream Pop"));
        put("Pop", Arrays.asList("Synth-Pop", "Electropop", "Indie Pop", "Dance Pop"));
        put("Rock", Arrays.asList("Classic Rock", "Indie Rock", "Progressive Rock", "Blues Rock"));
        put("Hip-Hop/Rap", Arrays.asList("R&B", "Neo-Soul", "Trip-Hop", "Conscious Rap"));
        put("R&B/Soul", Arrays.asList("Neo-Soul", "Contemporary R&B", "Funk", "Gospel"));
        put("Electronic", Arrays.asList("Ambient", "IDM", "Synthwave", "House"));
        put("Jazz", Arrays.asList("Smooth Jazz", "Bebop", "Fusion", "Nu-Jazz"));
        put("Classical", Arrays.asList("Baroque", "Romantic", "Contemporary Classical", "Chamber Music"));
        put("Country", Arrays.asList("Americana", "Folk", "Bluegrass", "Alt-Country"));
        put("Metal", Arrays.asList("Progressive Metal", "Post-Metal", "Doom Metal", "Stoner Rock"));
        put("Dance", Arrays.asList("House", "Techno", "Trance", "Drum & Bass"));
        put("Reggae", Arrays.asList("Dub", "Ska", "Dancehall", "Roots Reggae"));
        put("Blues", Arrays.asList("Delta Blues", "Chicago Blues", "Blues Rock", "Soul Blues"));
        put("Folk", Arrays.asList("Indie Folk", "Contemporary Folk", "Americana", "Celtic"));
        put("Latin", Arrays.asList("Reggaeton", "Salsa", "Bossa Nova", "Latin Pop"));
        put("Soundtrack", Arrays.asList("Film Score", "Musical Theatre", "Video Game Music", "Ambient"));
    }};

    // Artist similarity map for recommendations
    private static final Map<String, List<String>> ARTIST_RECOMMENDATIONS = new HashMap<>() {{
        put("Coldplay", Arrays.asList("Radiohead", "Muse", "Snow Patrol", "Keane", "The Fray"));
        put("Taylor Swift", Arrays.asList("Olivia Rodrigo", "Lorde", "Billie Eilish", "Ariana Grande"));
        put("Ed Sheeran", Arrays.asList("Sam Smith", "James Bay", "Lewis Capaldi", "Passenger"));
        put("The Beatles", Arrays.asList("The Rolling Stones", "The Kinks", "The Who", "Pink Floyd"));
        put("Adele", Arrays.asList("Sam Smith", "Amy Winehouse", "Duffy", "Florence + The Machine"));
        put("Drake", Arrays.asList("The Weeknd", "J. Cole", "Kendrick Lamar", "Post Malone"));
        put("Beyoncé", Arrays.asList("Rihanna", "SZA", "Solange", "Janelle Monáe"));
        put("Eminem", Arrays.asList("Kendrick Lamar", "Logic", "J. Cole", "NF"));
        put("Billie Eilish", Arrays.asList("Olivia Rodrigo", "Lorde", "Halsey", "AURORA"));
        put("The Weeknd", Arrays.asList("Frank Ocean", "SZA", "Daniel Caesar", "Khalid"));
    }};

    public AIInsightsService(LibraryAlbumRepository repository) {
        this.repository = repository;
    }

    public AIInsightsResponse generateInsights(Long userId) {
        List<LibraryAlbum> albums = repository.findByUserId(userId);

        if (albums.isEmpty()) {
            return AIInsightsResponse.builder()
                    .summary("Your library is empty! Start by searching for albums and adding them to your collection.")
                    .insights(List.of("Add some albums to get personalized insights."))
                    .recommendations(List.of("Try searching for your favorite artist to get started."))
                    .profile(null)
                    .build();
        }

        // Analyze library
        Map<String, Long> genreCounts = albums.stream()
                .filter(a -> a.getGenre() != null)
                .collect(Collectors.groupingBy(LibraryAlbum::getGenre, Collectors.counting()));

        Map<String, Long> artistCounts = albums.stream()
                .collect(Collectors.groupingBy(LibraryAlbum::getArtistName, Collectors.counting()));

        Map<String, Long> eraCounts = albums.stream()
                .filter(a -> a.getReleaseDate() != null)
                .collect(Collectors.groupingBy(
                        a -> getEra(a.getReleaseDate().getYear()),
                        Collectors.counting()
                ));

        // Find dominants
        String dominantGenre = genreCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Unknown");

        String dominantEra = eraCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Unknown");

        String favoriteArtist = artistCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Unknown");

        // Genre diversity (Shannon entropy normalized 0-100)
        double genreDiversity = calculateDiversityScore(genreCounts);

        // Build profile
        AIInsightsResponse.LibraryProfile profile = AIInsightsResponse.LibraryProfile.builder()
                .dominantGenre(dominantGenre)
                .dominantEra(dominantEra)
                .genreDiversityScore(Math.round(genreDiversity * 10.0) / 10.0)
                .favoriteArtist(favoriteArtist)
                .totalUniqueArtists(artistCounts.size())
                .totalUniqueGenres(genreCounts.size())
                .build();

        // Generate insights
        List<String> insights = generateTextInsights(albums, genreCounts, artistCounts, eraCounts, dominantGenre, dominantEra, favoriteArtist, genreDiversity);

        // Generate recommendations
        List<String> recommendations = generateRecommendations(genreCounts, artistCounts, dominantGenre, favoriteArtist);

        // Generate summary
        String summary = generateSummary(albums, dominantGenre, dominantEra, favoriteArtist, genreDiversity);

        return AIInsightsResponse.builder()
                .summary(summary)
                .insights(insights)
                .recommendations(recommendations)
                .profile(profile)
                .build();
    }

    private List<String> generateTextInsights(List<LibraryAlbum> albums,
                                               Map<String, Long> genreCounts,
                                               Map<String, Long> artistCounts,
                                               Map<String, Long> eraCounts,
                                               String dominantGenre,
                                               String dominantEra,
                                               String favoriteArtist,
                                               double genreDiversity) {
        List<String> insights = new ArrayList<>();

        // Genre insight
        long dominantGenreCount = genreCounts.getOrDefault(dominantGenre, 0L);
        double genrePercent = (dominantGenreCount * 100.0) / albums.size();
        insights.add(String.format("Your library leans heavily toward **%s** (%.0f%% of your collection). %s",
                dominantGenre, genrePercent,
                genrePercent > 50 ? "Consider exploring other genres for variety!" : "Nice genre balance!"));

        // Era insight
        insights.add(String.format("Most of your albums are from the **%s**. %s",
                dominantEra,
                dominantEra.contains("2020") ? "You love staying current with new releases!" :
                dominantEra.contains("2010") ? "The 2010s had incredible music — great taste!" :
                "You have a wonderful appreciation for classic albums!"));

        // Artist insight
        long artistAlbumCount = artistCounts.getOrDefault(favoriteArtist, 0L);
        if (artistAlbumCount > 1) {
            insights.add(String.format("You're a big **%s** fan with %d albums in your library!", favoriteArtist, artistAlbumCount));
        }

        // Diversity insight
        if (genreDiversity > 70) {
            insights.add("🌈 Impressive genre diversity! You have an eclectic taste spanning many genres.");
        } else if (genreDiversity > 40) {
            insights.add("🎵 Good genre variety! You enjoy a healthy mix of different styles.");
        } else {
            insights.add("🎯 You know what you like! Your library is focused on a few specific genres.");
        }

        // Rating insight
        OptionalDouble avgRating = albums.stream()
                .filter(a -> a.getUserRating() != null)
                .mapToInt(LibraryAlbum::getUserRating)
                .average();
        if (avgRating.isPresent()) {
            insights.add(String.format("Your average rating is **%.1f/5** stars. %s",
                    avgRating.getAsDouble(),
                    avgRating.getAsDouble() >= 4.0 ? "You're selective — only the best makes the cut!" :
                    avgRating.getAsDouble() >= 3.0 ? "You have balanced, thoughtful ratings." :
                    "You're a tough critic!"));
        }

        // Price insight
        albums.stream()
                .filter(a -> a.getCollectionPrice() != null)
                .mapToDouble(a -> a.getCollectionPrice().doubleValue())
                .average()
                .ifPresent(avg -> insights.add(String.format("Your average album price is **$%.2f**. Total library value: **$%.2f**.",
                        avg,
                        albums.stream()
                                .filter(a -> a.getCollectionPrice() != null)
                                .mapToDouble(a -> a.getCollectionPrice().doubleValue())
                                .sum())));

        return insights;
    }

    private List<String> generateRecommendations(Map<String, Long> genreCounts,
                                                  Map<String, Long> artistCounts,
                                                  String dominantGenre,
                                                  String favoriteArtist) {
        List<String> recommendations = new ArrayList<>();

        // Genre-based recommendations
        List<String> genreRecs = GENRE_RECOMMENDATIONS.getOrDefault(dominantGenre,
                Arrays.asList("Jazz", "Electronic", "World Music"));
        recommendations.add(String.format("Since you love **%s**, you might enjoy exploring **%s** and **%s**.",
                dominantGenre, genreRecs.get(0), genreRecs.get(1)));

        // Under-represented genres
        Set<String> userGenres = genreCounts.keySet();
        List<String> missingGenres = GENRE_RECOMMENDATIONS.keySet().stream()
                .filter(g -> !userGenres.contains(g))
                .limit(3)
                .collect(Collectors.toList());
        if (!missingGenres.isEmpty()) {
            recommendations.add(String.format("Branch out! You haven't explored **%s** yet — it might surprise you.",
                    String.join(", ", missingGenres.subList(0, Math.min(2, missingGenres.size())))));
        }

        // Artist-based recommendations
        List<String> artistRecs = ARTIST_RECOMMENDATIONS.getOrDefault(favoriteArtist, null);
        if (artistRecs != null) {
            recommendations.add(String.format("Fans of **%s** often enjoy **%s** and **%s** — give them a try!",
                    favoriteArtist, artistRecs.get(0), artistRecs.get(1)));
        }

        // Collection building tip
        if (artistCounts.size() < 5) {
            recommendations.add("🎧 Tip: Try adding albums from at least 5 different artists to build a more diverse collection.");
        }
        if (genreCounts.size() < 3) {
            recommendations.add("🎶 Tip: Explore at least 3 different genres to discover new favorites!");
        }

        return recommendations;
    }

    private String generateSummary(List<LibraryAlbum> albums, String dominantGenre,
                                    String dominantEra, String favoriteArtist, double diversity) {
        String diversityLabel = diversity > 70 ? "eclectic" : diversity > 40 ? "balanced" : "focused";
        return String.format(
                "Your library contains %d albums with a %s taste profile. " +
                "Dominated by %s from the %s era, with %s as your most-collected artist. " +
                "Genre diversity score: %.0f/100.",
                albums.size(), diversityLabel, dominantGenre, dominantEra, favoriteArtist, diversity);
    }

    private double calculateDiversityScore(Map<String, Long> genreCounts) {
        if (genreCounts.isEmpty()) return 0;
        long total = genreCounts.values().stream().mapToLong(Long::longValue).sum();
        if (total == 0) return 0;

        double entropy = 0;
        for (long count : genreCounts.values()) {
            double p = (double) count / total;
            if (p > 0) {
                entropy -= p * Math.log(p);
            }
        }

        // Normalize to 0-100 (max entropy = log(n) where n = number of genres)
        double maxEntropy = Math.log(genreCounts.size());
        return maxEntropy > 0 ? (entropy / maxEntropy) * 100 : 0;
    }

    private String getEra(int year) {
        if (year >= 2020) return "2020s";
        if (year >= 2010) return "2010s";
        if (year >= 2000) return "2000s";
        if (year >= 1990) return "1990s";
        if (year >= 1980) return "1980s";
        if (year >= 1970) return "1970s";
        return "Pre-1970s";
    }
}
