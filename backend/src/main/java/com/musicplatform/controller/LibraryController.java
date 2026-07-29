package com.musicplatform.controller;

import com.musicplatform.dto.AnalyticsResponse;
import com.musicplatform.dto.AIInsightsResponse;
import com.musicplatform.dto.SaveAlbumRequest;
import com.musicplatform.dto.UpdateAlbumRequest;
import com.musicplatform.model.LibraryAlbum;
import com.musicplatform.model.User;
import com.musicplatform.service.AIInsightsService;
import com.musicplatform.service.AnalyticsService;
import com.musicplatform.service.LibraryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/library")
public class LibraryController {

    private final LibraryService libraryService;
    private final AnalyticsService analyticsService;
    private final AIInsightsService aiInsightsService;

    public LibraryController(LibraryService libraryService,
                             AnalyticsService analyticsService,
                             AIInsightsService aiInsightsService) {
        this.libraryService = libraryService;
        this.analyticsService = analyticsService;
        this.aiInsightsService = aiInsightsService;
    }

    @GetMapping
    public ResponseEntity<Page<LibraryAlbum>> getLibrary(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<LibraryAlbum> library = libraryService.getUserLibrary(user.getId(), pageable);

        return ResponseEntity.ok(library);
    }

    @PostMapping
    public ResponseEntity<LibraryAlbum> saveAlbum(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody SaveAlbumRequest request) {

        LibraryAlbum saved = libraryService.saveAlbum(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LibraryAlbum> updateAlbum(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody UpdateAlbumRequest request) {

        LibraryAlbum updated = libraryService.updateAlbum(user.getId(), id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteAlbum(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {

        libraryService.deleteAlbum(user.getId(), id);
        return ResponseEntity.ok(Map.of("message", "Album removed from library"));
    }

    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsResponse> getAnalytics(@AuthenticationPrincipal User user) {
        AnalyticsResponse analytics = analyticsService.getAnalytics(user.getId());
        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/ai-insights")
    public ResponseEntity<AIInsightsResponse> getAIInsights(@AuthenticationPrincipal User user) {
        AIInsightsResponse insights = aiInsightsService.generateInsights(user.getId());
        return ResponseEntity.ok(insights);
    }
}
