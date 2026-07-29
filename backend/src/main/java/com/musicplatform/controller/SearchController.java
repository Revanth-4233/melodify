package com.musicplatform.controller;

import com.musicplatform.service.ITunesSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final ITunesSearchService searchService;

    public SearchController(ITunesSearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> search(
            @RequestParam String query,
            @RequestParam(defaultValue = "album") String type,
            @RequestParam(defaultValue = "25") int limit) {

        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Query parameter is required"));
        }

        String entity = switch (type.toLowerCase()) {
            case "album" -> "album";
            case "song" -> "song";
            case "artist" -> "musicArtist";
            default -> "album";
        };

        Map<String, Object> results = searchService.search(query.trim(), entity, limit);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/lookup/{id}")
    public ResponseEntity<Map<String, Object>> lookup(@PathVariable Long id) {
        Map<String, Object> result = searchService.lookup(id);
        return ResponseEntity.ok(result);
    }
}
