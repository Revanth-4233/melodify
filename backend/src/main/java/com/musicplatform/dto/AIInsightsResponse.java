package com.musicplatform.dto;

import java.util.List;

public class AIInsightsResponse {
    private String summary;
    private List<String> insights;
    private List<String> recommendations;
    private LibraryProfile profile;

    public AIInsightsResponse() {}

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public List<String> getInsights() { return insights; }
    public void setInsights(List<String> insights) { this.insights = insights; }
    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }
    public LibraryProfile getProfile() { return profile; }
    public void setProfile(LibraryProfile profile) { this.profile = profile; }

    public static AIInsightsResponseBuilder builder() { return new AIInsightsResponseBuilder(); }

    public static class AIInsightsResponseBuilder {
        private String summary;
        private List<String> insights, recommendations;
        private LibraryProfile profile;

        public AIInsightsResponseBuilder summary(String v) { this.summary = v; return this; }
        public AIInsightsResponseBuilder insights(List<String> v) { this.insights = v; return this; }
        public AIInsightsResponseBuilder recommendations(List<String> v) { this.recommendations = v; return this; }
        public AIInsightsResponseBuilder profile(LibraryProfile v) { this.profile = v; return this; }

        public AIInsightsResponse build() {
            AIInsightsResponse r = new AIInsightsResponse();
            r.summary = summary; r.insights = insights; r.recommendations = recommendations; r.profile = profile;
            return r;
        }
    }

    public static class LibraryProfile {
        private String dominantGenre;
        private String dominantEra;
        private double genreDiversityScore;
        private String favoriteArtist;
        private int totalUniqueArtists;
        private int totalUniqueGenres;

        public LibraryProfile() {}

        public String getDominantGenre() { return dominantGenre; }
        public void setDominantGenre(String dominantGenre) { this.dominantGenre = dominantGenre; }
        public String getDominantEra() { return dominantEra; }
        public void setDominantEra(String dominantEra) { this.dominantEra = dominantEra; }
        public double getGenreDiversityScore() { return genreDiversityScore; }
        public void setGenreDiversityScore(double genreDiversityScore) { this.genreDiversityScore = genreDiversityScore; }
        public String getFavoriteArtist() { return favoriteArtist; }
        public void setFavoriteArtist(String favoriteArtist) { this.favoriteArtist = favoriteArtist; }
        public int getTotalUniqueArtists() { return totalUniqueArtists; }
        public void setTotalUniqueArtists(int totalUniqueArtists) { this.totalUniqueArtists = totalUniqueArtists; }
        public int getTotalUniqueGenres() { return totalUniqueGenres; }
        public void setTotalUniqueGenres(int totalUniqueGenres) { this.totalUniqueGenres = totalUniqueGenres; }

        public static LibraryProfileBuilder builder() { return new LibraryProfileBuilder(); }

        public static class LibraryProfileBuilder {
            private String dominantGenre, dominantEra, favoriteArtist;
            private double genreDiversityScore;
            private int totalUniqueArtists, totalUniqueGenres;

            public LibraryProfileBuilder dominantGenre(String v) { this.dominantGenre = v; return this; }
            public LibraryProfileBuilder dominantEra(String v) { this.dominantEra = v; return this; }
            public LibraryProfileBuilder genreDiversityScore(double v) { this.genreDiversityScore = v; return this; }
            public LibraryProfileBuilder favoriteArtist(String v) { this.favoriteArtist = v; return this; }
            public LibraryProfileBuilder totalUniqueArtists(int v) { this.totalUniqueArtists = v; return this; }
            public LibraryProfileBuilder totalUniqueGenres(int v) { this.totalUniqueGenres = v; return this; }

            public LibraryProfile build() {
                LibraryProfile p = new LibraryProfile();
                p.dominantGenre = dominantGenre; p.dominantEra = dominantEra;
                p.genreDiversityScore = genreDiversityScore; p.favoriteArtist = favoriteArtist;
                p.totalUniqueArtists = totalUniqueArtists; p.totalUniqueGenres = totalUniqueGenres;
                return p;
            }
        }
    }
}
