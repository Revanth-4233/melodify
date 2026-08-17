package com.musicinsights.controller;

import com.musicinsights.entity.User;
import com.musicinsights.service.AuthService;
import com.musicinsights.service.ItunesProxyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class SearchController {

    private final ItunesProxyService itunesProxyService;
    private final AuthService authService;

    public SearchController(ItunesProxyService itunesProxyService, AuthService authService) {
        this.itunesProxyService = itunesProxyService;
        this.authService = authService;
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> search(
            @RequestParam String query,
            @RequestParam(defaultValue = "25") int limit,
            @RequestParam(defaultValue = "album") String entity,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Search query cannot be empty"
            ));
        }

        if (limit < 1 || limit > 200) {
            limit = 25;
        }

        User user = userDetails != null ? authService.getCurrentUser(userDetails.getUsername()) : null;
        Map<String, Object> results = user != null
                ? itunesProxyService.searchWithLibraryFlags(query.trim(), limit, entity, user)
                : itunesProxyService.search(query.trim(), limit, entity);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/album/{id}/tracks")
    public ResponseEntity<Map<String, Object>> getAlbumTracks(@PathVariable Long id) {
        Map<String, Object> tracks = itunesProxyService.getAlbumTracks(id);
        return ResponseEntity.ok(tracks);
    }
}
