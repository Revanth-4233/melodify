package com.musicinsights.controller;

import com.musicinsights.dto.AnalyticsResponse;
import com.musicinsights.entity.PlayEvent;
import com.musicinsights.entity.User;
import com.musicinsights.repository.PlayEventRepository;
import com.musicinsights.service.AnalyticsService;
import com.musicinsights.service.AsyncEventProcessor;
import com.musicinsights.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import com.musicinsights.entity.User;
import com.musicinsights.service.AnalyticsService;
import com.musicinsights.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final AuthService authService;
    private final AsyncEventProcessor asyncEventProcessor;

    public AnalyticsController(AnalyticsService analyticsService, AuthService authService, AsyncEventProcessor asyncEventProcessor) {
        this.analyticsService = analyticsService;
        this.authService = authService;
        this.asyncEventProcessor = asyncEventProcessor;
    }

    @GetMapping
    public ResponseEntity<AnalyticsResponse> getAnalytics(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        AnalyticsResponse response = analyticsService.getAnalytics(user);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/play")
    public ResponseEntity<?> logPlayEvent(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal UserDetails userDetails) {

        Object songIdObj = payload.get("songId");
        if (songIdObj == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "songId is required"));
        }

        Long songId;
        if (songIdObj instanceof Number) {
            songId = ((Number) songIdObj).longValue();
        } else {
            songId = Long.parseLong(songIdObj.toString());
        }

        User user = null;
        if (userDetails != null) {
            user = authService.getCurrentUser(userDetails.getUsername());
        }

        PlayEvent event = new PlayEvent();
        event.setUser(user);
        event.setCachedSongId(songId);
        event.setPlayedAt(LocalDateTime.now());
        
        // Push to memory queue for bulk async processing!
        asyncEventProcessor.enqueuePlayEvent(event);

        return ResponseEntity.ok(Map.of("status", "logged"));
    }
}
