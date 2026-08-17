package com.musicinsights.dto;

import java.util.List;
import java.util.Map;

public class AiInsightResponse {

    private String listenerPersona;
    private String moodProfile;
    private String eraAnalysis;
    private String genreInsight;
    private List<String> recommendations;
    private List<String> hiddenGems;
    private String trendSummary;
    private Map<String, Object> stats;

    public AiInsightResponse() {}

    public String getListenerPersona() { return listenerPersona; }
    public void setListenerPersona(String listenerPersona) { this.listenerPersona = listenerPersona; }

    public String getMoodProfile() { return moodProfile; }
    public void setMoodProfile(String moodProfile) { this.moodProfile = moodProfile; }

    public String getEraAnalysis() { return eraAnalysis; }
    public void setEraAnalysis(String eraAnalysis) { this.eraAnalysis = eraAnalysis; }

    public String getGenreInsight() { return genreInsight; }
    public void setGenreInsight(String genreInsight) { this.genreInsight = genreInsight; }

    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }

    public List<String> getHiddenGems() { return hiddenGems; }
    public void setHiddenGems(List<String> hiddenGems) { this.hiddenGems = hiddenGems; }

    public String getTrendSummary() { return trendSummary; }
    public void setTrendSummary(String trendSummary) { this.trendSummary = trendSummary; }

    public Map<String, Object> getStats() { return stats; }
    public void setStats(Map<String, Object> stats) { this.stats = stats; }
}
