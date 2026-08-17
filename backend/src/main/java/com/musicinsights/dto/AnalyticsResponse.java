package com.musicinsights.dto;

import java.util.List;
import java.util.Map;

public class AnalyticsResponse {

    private long totalAlbums;
    private Double averageRating;
    private String topGenre;
    private String topArtist;
    private String topDecade;
    private Map<String, Long> genreDistribution;
    private Map<String, Long> artistDistribution;
    private Map<Integer, Long> ratingDistribution;
    private Map<String, Long> yearDistribution;

    public AnalyticsResponse() {}

    public long getTotalAlbums() { return totalAlbums; }
    public void setTotalAlbums(long totalAlbums) { this.totalAlbums = totalAlbums; }

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public String getTopGenre() { return topGenre; }
    public void setTopGenre(String topGenre) { this.topGenre = topGenre; }

    public String getTopArtist() { return topArtist; }
    public void setTopArtist(String topArtist) { this.topArtist = topArtist; }

    public String getTopDecade() { return topDecade; }
    public void setTopDecade(String topDecade) { this.topDecade = topDecade; }

    public Map<String, Long> getGenreDistribution() { return genreDistribution; }
    public void setGenreDistribution(Map<String, Long> genreDistribution) { this.genreDistribution = genreDistribution; }

    public Map<String, Long> getArtistDistribution() { return artistDistribution; }
    public void setArtistDistribution(Map<String, Long> artistDistribution) { this.artistDistribution = artistDistribution; }

    public Map<Integer, Long> getRatingDistribution() { return ratingDistribution; }
    public void setRatingDistribution(Map<Integer, Long> ratingDistribution) { this.ratingDistribution = ratingDistribution; }

    public Map<String, Long> getYearDistribution() { return yearDistribution; }
    public void setYearDistribution(Map<String, Long> yearDistribution) { this.yearDistribution = yearDistribution; }
}
