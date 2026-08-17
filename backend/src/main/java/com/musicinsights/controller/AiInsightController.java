package com.musicinsights.controller;

import com.musicinsights.dto.AiInsightRequest;
import com.musicinsights.dto.AiInsightResponse;
import com.musicinsights.entity.User;
import com.musicinsights.service.AiInsightService;
import com.musicinsights.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiInsightController {

    private final AiInsightService aiInsightService;
    private final AuthService authService;

    public AiInsightController(AiInsightService aiInsightService, AuthService authService) {
        this.aiInsightService = aiInsightService;
        this.authService = authService;
    }

    @PostMapping("/insights")
    public ResponseEntity<AiInsightResponse> getInsights(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody(required = false) AiInsightRequest request) {

        User user = authService.getCurrentUser(userDetails.getUsername());
        String query = (request != null && request.getQuery() != null)
                ? request.getQuery() : "";

        AiInsightResponse response = aiInsightService.generateInsights(user, query);
        return ResponseEntity.ok(response);
    }
}
