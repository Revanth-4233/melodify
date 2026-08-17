package com.musicinsights.controller;

import com.musicinsights.service.StreamResolverService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stream")
public class StreamResolverController {

    private final StreamResolverService streamResolverService;

    public StreamResolverController(StreamResolverService streamResolverService) {
        this.streamResolverService = streamResolverService;
    }

    @GetMapping("/resolve")
    public ResponseEntity<Map<String, Object>> resolveStream(
            @RequestParam String trackName,
            @RequestParam(required = false, defaultValue = "") String artistName,
            @RequestParam(required = false, defaultValue = "") String collectionName,
            @RequestParam(required = false, defaultValue = "telugu") String language) {

        Map<String, Object> streamInfo = streamResolverService.resolveFullStream(trackName, artistName, collectionName, language);
        return ResponseEntity.ok(streamInfo);
    }
}
