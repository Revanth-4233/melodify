package com.musicplatform.dto;

import java.math.BigDecimal;
import java.util.List;

public class AnalyticsResponse {
    private int totalAlbums;
    private int totalArtists;
    private int totalGenres;
    private double averageRating;
    private BigDecimal totalValue;
    private List<ChartData> genreDistribution;
    private List<ChartData> releasesByYear;
    private List<ChartData> ratingDistribution;
    private List<ChartData> topArtists;
    private List<ChartData> libraryGrowth;

    public AnalyticsResponse() {}

    public int getTotalAlbums() { return totalAlbums; }
    public void setTotalAlbums(int totalAlbums) { this.totalAlbums = totalAlbums; }
    public int getTotalArtists() { return totalArtists; }
    public void setTotalArtists(int totalArtists) { this.totalArtists = totalArtists; }
    public int getTotalGenres() { return totalGenres; }
    public void setTotalGenres(int totalGenres) { this.totalGenres = totalGenres; }
    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }
    public BigDecimal getTotalValue() { return totalValue; }
    public void setTotalValue(BigDecimal totalValue) { this.totalValue = totalValue; }
    public List<ChartData> getGenreDistribution() { return genreDistribution; }
    public void setGenreDistribution(List<ChartData> genreDistribution) { this.genreDistribution = genreDistribution; }
    public List<ChartData> getReleasesByYear() { return releasesByYear; }
    public void setReleasesByYear(List<ChartData> releasesByYear) { this.releasesByYear = releasesByYear; }
    public List<ChartData> getRatingDistribution() { return ratingDistribution; }
    public void setRatingDistribution(List<ChartData> ratingDistribution) { this.ratingDistribution = ratingDistribution; }
    public List<ChartData> getTopArtists() { return topArtists; }
    public void setTopArtists(List<ChartData> topArtists) { this.topArtists = topArtists; }
    public List<ChartData> getLibraryGrowth() { return libraryGrowth; }
    public void setLibraryGrowth(List<ChartData> libraryGrowth) { this.libraryGrowth = libraryGrowth; }

    public static AnalyticsResponseBuilder builder() { return new AnalyticsResponseBuilder(); }

    public static class AnalyticsResponseBuilder {
        private int totalAlbums, totalArtists, totalGenres;
        private double averageRating;
        private BigDecimal totalValue;
        private List<ChartData> genreDistribution, releasesByYear, ratingDistribution, topArtists, libraryGrowth;

        public AnalyticsResponseBuilder totalAlbums(int v) { this.totalAlbums = v; return this; }
        public AnalyticsResponseBuilder totalArtists(int v) { this.totalArtists = v; return this; }
        public AnalyticsResponseBuilder totalGenres(int v) { this.totalGenres = v; return this; }
        public AnalyticsResponseBuilder averageRating(double v) { this.averageRating = v; return this; }
        public AnalyticsResponseBuilder totalValue(BigDecimal v) { this.totalValue = v; return this; }
        public AnalyticsResponseBuilder genreDistribution(List<ChartData> v) { this.genreDistribution = v; return this; }
        public AnalyticsResponseBuilder releasesByYear(List<ChartData> v) { this.releasesByYear = v; return this; }
        public AnalyticsResponseBuilder ratingDistribution(List<ChartData> v) { this.ratingDistribution = v; return this; }
        public AnalyticsResponseBuilder topArtists(List<ChartData> v) { this.topArtists = v; return this; }
        public AnalyticsResponseBuilder libraryGrowth(List<ChartData> v) { this.libraryGrowth = v; return this; }

        public AnalyticsResponse build() {
            AnalyticsResponse r = new AnalyticsResponse();
            r.totalAlbums = totalAlbums; r.totalArtists = totalArtists; r.totalGenres = totalGenres;
            r.averageRating = averageRating; r.totalValue = totalValue;
            r.genreDistribution = genreDistribution; r.releasesByYear = releasesByYear;
            r.ratingDistribution = ratingDistribution; r.topArtists = topArtists; r.libraryGrowth = libraryGrowth;
            return r;
        }
    }

    public static class ChartData {
        private String label;
        private Number value;

        public ChartData() {}
        public ChartData(String label, Number value) { this.label = label; this.value = value; }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public Number getValue() { return value; }
        public void setValue(Number value) { this.value = value; }

        public static ChartDataBuilder builder() { return new ChartDataBuilder(); }

        public static class ChartDataBuilder {
            private String label;
            private Number value;
            public ChartDataBuilder label(String label) { this.label = label; return this; }
            public ChartDataBuilder value(Number value) { this.value = value; return this; }
            public ChartData build() { return new ChartData(label, value); }
        }
    }
}
