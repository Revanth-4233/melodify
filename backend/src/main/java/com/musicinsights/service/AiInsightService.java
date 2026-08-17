package com.musicinsights.service;

import com.musicinsights.dto.AiInsightResponse;
import com.musicinsights.entity.LibraryItem;
import com.musicinsights.entity.User;
import com.musicinsights.repository.LibraryItemRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiInsightService {

    private final LibraryItemRepository libraryItemRepository;

    public AiInsightService(LibraryItemRepository libraryItemRepository) {
        this.libraryItemRepository = libraryItemRepository;
    }

    public AiInsightResponse generateInsights(User user, String query) {
        List<LibraryItem> items = libraryItemRepository.findByUser(user);
        AiInsightResponse response = new AiInsightResponse();

        if (items.isEmpty()) {
            response.setListenerPersona("🎵 New Explorer — Your musical journey is just beginning! Add some albums to discover your listener personality.");
            response.setMoodProfile("Add albums to your library to generate a mood profile.");
            response.setEraAnalysis("No albums yet to analyze era preferences.");
            response.setGenreInsight("Start building your library to see genre insights.");
            response.setRecommendations(List.of("Search for your favorite artists and add their albums to get started!"));
            response.setHiddenGems(List.of());
            response.setTrendSummary("Build your library with at least 3 albums to see trends.");
            response.setStats(Map.of("totalAlbums", 0));
            return response;
        }

        // Analyze genre distribution
        Map<String, Long> genreCounts = items.stream()
                .collect(Collectors.groupingBy(LibraryItem::getGenre, Collectors.counting()));
        String topGenre = genreCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Unknown");
        long topGenreCount = genreCounts.getOrDefault(topGenre, 0L);
        double genreDiversity = genreCounts.size() / (double) Math.max(items.size(), 1);

        // Analyze era distribution
        Map<String, Long> decadeCounts = items.stream()
                .filter(i -> i.getReleaseDate() != null && i.getReleaseDate().length() >= 4)
                .collect(Collectors.groupingBy(
                        i -> {
                            int y = Integer.parseInt(i.getReleaseDate().substring(0, 4));
                            return ((y / 10) * 10) + "s";
                        },
                        Collectors.counting()
                ));
        String topDecade = decadeCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Unknown");

        // Analyze artist distribution
        Map<String, Long> artistCounts = items.stream()
                .collect(Collectors.groupingBy(LibraryItem::getArtistName, Collectors.counting()));
        String topArtist = artistCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Unknown");
        long uniqueArtists = artistCounts.size();

        // Analyze ratings
        OptionalDouble avgRating = items.stream()
                .filter(i -> i.getUserRating() != null)
                .mapToInt(LibraryItem::getUserRating)
                .average();
        long ratedCount = items.stream().filter(i -> i.getUserRating() != null).count();

        // Generate Listener Persona
        response.setListenerPersona(generatePersona(topGenre, topDecade, genreDiversity,
                items.size(), uniqueArtists, avgRating));

        // Generate Mood Profile
        response.setMoodProfile(generateMoodProfile(genreCounts, topGenre, topDecade));

        // Generate Era Analysis
        response.setEraAnalysis(generateEraAnalysis(decadeCounts, topDecade, items.size()));

        // Generate Genre Insight
        response.setGenreInsight(generateGenreInsight(genreCounts, topGenre, topGenreCount, items.size()));

        // Generate Recommendations
        response.setRecommendations(generateRecommendations(topGenre, topArtist, topDecade,
                genreCounts, artistCounts));

        // Generate Hidden Gems (low-rated or under-explored genre items)
        response.setHiddenGems(findHiddenGems(items, genreCounts));

        // Generate Trend Summary
        response.setTrendSummary(generateTrendSummary(items, genreCounts, artistCounts, decadeCounts));

        // Stats
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalAlbums", items.size());
        stats.put("uniqueArtists", uniqueArtists);
        stats.put("uniqueGenres", genreCounts.size());
        stats.put("avgRating", avgRating.isPresent() ? Math.round(avgRating.getAsDouble() * 100.0) / 100.0 : null);
        stats.put("ratedAlbums", ratedCount);
        stats.put("topGenre", topGenre);
        stats.put("topArtist", topArtist);
        stats.put("topDecade", topDecade);
        response.setStats(stats);

        return response;
    }

    private String generatePersona(String topGenre, String topDecade, double genreDiversity,
                                   int totalAlbums, long uniqueArtists, OptionalDouble avgRating) {
        StringBuilder persona = new StringBuilder();

        // Determine archetype based on genre and diversity
        if (genreDiversity > 0.7) {
            persona.append("🌍 The Eclectic Voyager — ");
            persona.append("You're a musical explorer with incredibly diverse taste! ");
            persona.append(String.format("Across %d albums from %d unique artists, you refuse to be boxed into a single genre. ", totalAlbums, uniqueArtists));
        } else if (genreDiversity > 0.4) {
            persona.append("🎭 The Balanced Connoisseur — ");
            persona.append("You appreciate variety while maintaining clear preferences. ");
            persona.append(String.format("With %d albums spanning multiple genres, your heart beats strongest for %s. ", totalAlbums, topGenre));
        } else {
            persona.append("💎 The Genre Devotee — ");
            persona.append(String.format("You're a true %s aficionado! ", topGenre));
            persona.append(String.format("With %d albums deeply rooted in this genre, your dedication shows refined, focused taste. ", totalAlbums));
        }

        // Add era flavor
        persona.append(String.format("Your sweet spot era is the %s", topDecade));
        if (topDecade.startsWith("19")) {
            persona.append(", showing you value the classics and timeless sounds.");
        } else if (topDecade.startsWith("200")) {
            persona.append(", capturing the golden age of digital music transformation.");
        } else {
            persona.append(", riding the wave of contemporary music evolution.");
        }

        // Add rating behavior
        if (avgRating.isPresent()) {
            double avg = avgRating.getAsDouble();
            if (avg >= 4.0) {
                persona.append(" You're a generous rater — you truly love the music you collect!");
            } else if (avg >= 3.0) {
                persona.append(" Your balanced ratings show a critical yet appreciative ear.");
            } else {
                persona.append(" You're a tough critic — only the best earn your top marks!");
            }
        }

        return persona.toString();
    }

    private String generateMoodProfile(Map<String, Long> genreCounts, String topGenre, String topDecade) {
        StringBuilder mood = new StringBuilder();

        Map<String, String> genreMoods = Map.ofEntries(
                Map.entry("Pop", "✨ Upbeat & Energetic — Your library radiates positivity and mainstream appeal. Perfect for social gatherings and feel-good moments."),
                Map.entry("Rock", "🔥 Bold & Intense — Your collection pulses with raw energy and powerful emotion. Ideal for moments of empowerment and catharsis."),
                Map.entry("Alternative", "🌙 Introspective & Edgy — You're drawn to music that challenges conventions. Your library is a sanctuary for deep thinking and creative inspiration."),
                Map.entry("Hip-Hop/Rap", "💫 Confident & Dynamic — Your beats-driven collection reflects urban culture and lyrical storytelling. Great for motivation and self-expression."),
                Map.entry("R&B/Soul", "💜 Smooth & Soulful — Your music choices ooze warmth and emotional depth. Perfect for intimate moments and relaxation."),
                Map.entry("Electronic", "⚡ Futuristic & Pulsing — Your library is a sonic journey through synthesized landscapes. Built for movement and transcendence."),
                Map.entry("Jazz", "🎷 Sophisticated & Contemplative — Your refined taste leans toward complexity and improvisation. A library for intellectual stimulation."),
                Map.entry("Classical", "🎻 Timeless & Majestic — Your collection celebrates compositional mastery and emotional grandeur. Perfect for focus and reflection."),
                Map.entry("Country", "🤠 Authentic & Storytelling — Your library tells tales of life, love, and landscapes. Music that feels like coming home."),
                Map.entry("Metal", "⛓️ Powerful & Cathartic — Your heavy collection is therapy through intensity. A library for channeling raw emotion."),
                Map.entry("Indie", "🎸 Creative & Authentic — Your collection celebrates artistic independence and unique sonic identities.")
        );

        String moodText = genreMoods.getOrDefault(topGenre,
                "🎵 Unique & Personal — Your eclectic taste creates a mood that's entirely your own. A curated experience that defies easy categorization.");
        mood.append(moodText);

        if (genreCounts.size() > 3) {
            mood.append(" With ").append(genreCounts.size())
                    .append(" genres in your library, your mood palette is beautifully complex.");
        }

        return mood.toString();
    }

    private String generateEraAnalysis(Map<String, Long> decadeCounts, String topDecade, int totalAlbums) {
        StringBuilder era = new StringBuilder();

        era.append(String.format("📅 Your collection gravitates toward the %s", topDecade));

        Map<String, String> eraCharacteristics = Map.of(
                "1960s", " — the era of revolutionary rock, Motown soul, and the British Invasion.",
                "1970s", " — the golden age of progressive rock, disco, and punk rebellion.",
                "1980s", " — the decade of synth-pop, new wave, and MTV's visual revolution.",
                "1990s", " — grunge, alternative explosion, and hip-hop's mainstream breakthrough.",
                "2000s", " — digital revolution, indie renaissance, and genre-blending innovation.",
                "2010s", " — streaming era, EDM explosion, and the rise of global pop.",
                "2020s", " — post-pandemic creativity, hyper-pop, and AI-influenced production."
        );

        era.append(eraCharacteristics.getOrDefault(topDecade, " — showcasing your unique temporal taste."));

        if (decadeCounts.size() > 2) {
            era.append(String.format(" Your collection spans %d different decades, showing musical curiosity across time.", decadeCounts.size()));
        }

        return era.toString();
    }

    private String generateGenreInsight(Map<String, Long> genreCounts, String topGenre,
                                        long topGenreCount, int totalAlbums) {
        StringBuilder insight = new StringBuilder();

        double percentage = (topGenreCount / (double) totalAlbums) * 100;
        insight.append(String.format("🎵 %s dominates your library at %.0f%% (%d of %d albums). ",
                topGenre, percentage, topGenreCount, totalAlbums));

        if (genreCounts.size() == 1) {
            insight.append("You're a genre purist — complete dedication to ").append(topGenre).append("!");
        } else if (genreCounts.size() <= 3) {
            List<String> otherGenres = genreCounts.keySet().stream()
                    .filter(g -> !g.equals(topGenre))
                    .collect(Collectors.toList());
            insight.append("You also explore ").append(String.join(" and ", otherGenres))
                    .append(", creating a focused yet versatile collection.");
        } else {
            insight.append(String.format("With %d genres represented, you have a wonderfully diverse musical palette!",
                    genreCounts.size()));
        }

        return insight.toString();
    }

    private List<String> generateRecommendations(String topGenre, String topArtist, String topDecade,
                                                  Map<String, Long> genreCounts,
                                                  Map<String, Long> artistCounts) {
        List<String> recs = new ArrayList<>();

        // Genre-based recommendations
        Map<String, List<String>> genreRecs = Map.ofEntries(
                Map.entry("Telugu/Tamil", List.of("A.R. Rahman — Chikiri Chikiri (Peddi)", "Sid Sriram — Urike Urike", "Anirudh Ravichander — Hukum (Jailer)", "Sita Ramam — Oh Sita Hey Rama", "Devi Sri Prasad — Pushpa 2 Melodies")),
                Map.entry("Telugu", List.of("A.R. Rahman — Chikiri Chikiri", "Sita Ramam — Oh Sita Hey Rama", "Sid Sriram — Urike Urike", "Devara — Fear Song")),
                Map.entry("Tamil", List.of("Anirudh Ravichander — Hukum", "A.R. Rahman — Ponniyin Selvan", "G.V. Prakash — Amaran Hits")),
                Map.entry("Pop", List.of("Dua Lipa — Future Nostalgia", "Harry Styles — Harry's House", "Billie Eilish — Happier Than Ever", "The Weeknd — After Hours")),
                Map.entry("Rock", List.of("Arctic Monkeys — AM", "Foo Fighters — Wasting Light", "Tame Impala — Currents", "Queens of the Stone Age — ...Like Clockwork")),
                Map.entry("Alternative", List.of("A.R. Rahman — Masterpiece Collection", "Sid Sriram — Essential Melodies", "Anirudh — Viral Hits")),
                Map.entry("Hip-Hop/Rap", List.of("Brodha V — Indian Hip Hop", "DIVINE — Punya Paap", "Yo Yo Honey Singh — Glory", "MC Stan — Insaan")),
                Map.entry("R&B/Soul", List.of("Sid Sriram — Soulful Melodies", "Frank Ocean — Blonde", "SZA — Ctrl")),
                Map.entry("Electronic", List.of("Daft Punk — Random Access Memories", "Flume — Skin", "ODESZA — A Moment Apart")),
                Map.entry("Jazz", List.of("Kamasi Washington — The Epic", "Robert Glasper — Black Radio")),
                Map.entry("Classical", List.of("A.R. Rahman — Classical Symphonies", "Max Richter — Sleep")),
                Map.entry("Country", List.of("Chris Stapleton — Traveller", "Kacey Musgraves — Golden Hour")),
                Map.entry("Metal", List.of("Gojira — Magma", "Mastodon — Crack the Skye")),
                Map.entry("Indie", List.of("Prateek Kuhad — Cold/Mess", "Anuv Jain — Baarishein", "When Chai Met Toast — Joy of Little Things"))
        );

        List<String> genreSpecific = genreRecs.getOrDefault(topGenre,
                List.of("A.R. Rahman — Chikiri Chikiri (From Peddi)", "Sid Sriram — Urike Urike (From Hi Nanna)",
                        "Anirudh Ravichander — Hukum (From Jailer)", "Sita Ramam — Oh Sita Hey Rama"));

        // Filter out artists already heavily in library
        Set<String> existingArtists = artistCounts.keySet().stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        for (String rec : genreSpecific) {
            String recArtist = rec.split("—")[0].trim().toLowerCase();
            if (!existingArtists.contains(recArtist)) {
                recs.add("🎵 " + rec);
            }
            if (recs.size() >= 4) break;
        }

        // Cross-genre recommendation
        if (genreCounts.size() < 3) {
            Map<String, String> crossGenre = Map.of(
                    "Pop", "Try exploring Indie or Electronic for something fresh!",
                    "Rock", "Consider checking out Blues or Jazz roots that inspired your favorites.",
                    "Alternative", "You might love Post-Rock or Ambient Electronic.",
                    "Hip-Hop/Rap", "Explore Neo-Soul or Jazz-Hop for a smooth twist.",
                    "Electronic", "Check out Ambient or Post-Classical for a deeper dive.",
                    "Classical", "Explore Film Scores or Minimalist Electronic music."
            );
            String crossRec = crossGenre.getOrDefault(topGenre,
                    "Expand your horizons — try a genre you haven't explored yet!");
            recs.add("🌟 " + crossRec);
        }

        if (recs.isEmpty()) {
            recs.add("🎵 Keep exploring — your diverse library already covers many great albums!");
        }

        return recs;
    }

    private List<String> findHiddenGems(List<LibraryItem> items, Map<String, Long> genreCounts) {
        List<String> gems = new ArrayList<>();

        // Find albums in under-represented genres
        long avgGenreCount = genreCounts.values().stream()
                .mapToLong(Long::longValue).sum() / Math.max(genreCounts.size(), 1);

        for (LibraryItem item : items) {
            long genreCount = genreCounts.getOrDefault(item.getGenre(), 0L);
            if (genreCount <= avgGenreCount / 2 && gems.size() < 3) {
                gems.add(String.format("💎 \"%s\" by %s — A rare %s gem in your collection!",
                        item.getTitle(), item.getArtistName(), item.getGenre()));
            }
        }

        // Find highly rated albums
        items.stream()
                .filter(i -> i.getUserRating() != null && i.getUserRating() == 5)
                .limit(2)
                .forEach(i -> gems.add(String.format("⭐ \"%s\" by %s — One of your top-rated masterpieces!",
                        i.getTitle(), i.getArtistName())));

        return gems;
    }

    private String generateTrendSummary(List<LibraryItem> items, Map<String, Long> genreCounts,
                                        Map<String, Long> artistCounts, Map<String, Long> decadeCounts) {
        StringBuilder trend = new StringBuilder();

        trend.append(String.format("📊 Library Overview: %d albums, %d artists, %d genres",
                items.size(), artistCounts.size(), genreCounts.size()));

        if (decadeCounts.size() > 0) {
            trend.append(String.format(", spanning %d decades", decadeCounts.size()));
        }
        trend.append(". ");

        // Concentration analysis
        long maxArtistCount = artistCounts.values().stream().mapToLong(Long::longValue).max().orElse(0);
        if (maxArtistCount > 3) {
            String favArtist = artistCounts.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("");
            trend.append(String.format("You're a dedicated %s fan with %d albums! ", favArtist, maxArtistCount));
        }

        // Rating trend
        OptionalDouble avgRating = items.stream()
                .filter(i -> i.getUserRating() != null)
                .mapToInt(LibraryItem::getUserRating)
                .average();
        if (avgRating.isPresent()) {
            trend.append(String.format("Your average rating of %.1f/5 ", avgRating.getAsDouble()));
            if (avgRating.getAsDouble() >= 4.0) {
                trend.append("shows you curate quality over quantity.");
            } else if (avgRating.getAsDouble() >= 3.0) {
                trend.append("reflects a balanced, critical approach to music.");
            } else {
                trend.append("suggests you're still searching for your perfect sound.");
            }
        }

        return trend.toString();
    }
}
