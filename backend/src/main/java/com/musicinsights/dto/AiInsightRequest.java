package com.musicinsights.dto;

public class AiInsightRequest {

    private String query;

    public AiInsightRequest() {}

    public AiInsightRequest(String query) {
        this.query = query;
    }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
}
