package com.musicinsights.controller;

import com.musicinsights.entity.CachedSong;
import com.musicinsights.service.RecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping
    public ResponseEntity<List<CachedSong>> getRecommendations() {
        List<CachedSong> recommendations = recommendationService.getRecommendations();
        return ResponseEntity.ok(recommendations);
    }
}
