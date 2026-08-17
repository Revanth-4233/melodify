package com.musicinsights.controller;

import com.musicinsights.dto.JamStateDto;
import com.musicinsights.entity.User;
import com.musicinsights.service.AuthService;
import com.musicinsights.service.JamSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/jam")
public class JamSyncController {

    private final JamSyncService jamSyncService;
    private final AuthService authService;

    public JamSyncController(JamSyncService jamSyncService, AuthService authService) {
        this.jamSyncService = jamSyncService;
        this.authService = authService;
    }

    private User resolveUser(UserDetails userDetails, String fallbackUsername) {
        if (userDetails != null && userDetails.getUsername() != null) {
            try {
                User u = authService.getCurrentUser(userDetails.getUsername());
                if (u != null) return u;
            } catch (Exception e) {}
        }
        User fallback = new User();
        fallback.setId(999L);
        fallback.setUsername(fallbackUsername != null ? fallbackUsername : "Aura Friend");
        fallback.setEmail("jam@auramusic.com");
        return fallback;
    }

    @PostMapping("/create")
    public ResponseEntity<JamStateDto> createRoom(@AuthenticationPrincipal UserDetails userDetails,
                                                 @RequestBody(required = false) Map<String, String> body) {
        String username = body != null ? body.get("username") : null;
        User user = resolveUser(userDetails, username != null ? username : "Host");
        JamStateDto room = jamSyncService.createRoom(user);
        return ResponseEntity.ok(room);
    }

    @PostMapping("/join")
    public ResponseEntity<JamStateDto> joinRoom(@AuthenticationPrincipal UserDetails userDetails,
                                                 @RequestParam(required = false) String roomCode,
                                                 @RequestBody(required = false) Map<String, String> body) {
        String code = roomCode != null ? roomCode : (body != null ? body.get("roomCode") : "JAM-1001");
        String username = body != null ? body.get("username") : null;
        User user = resolveUser(userDetails, username != null ? username : "Listener");
        JamStateDto room = jamSyncService.joinRoom(code, user);
        return ResponseEntity.ok(room);
    }

    @PostMapping("/sync")
    public ResponseEntity<JamStateDto> updateSyncState(@AuthenticationPrincipal UserDetails userDetails,
                                                        @RequestBody Map<String, Object> body) {
        String username = body.get("username") != null ? (String) body.get("username") : "Host";
        User user = resolveUser(userDetails, username);
        String roomCode = (String) body.get("roomCode");
        @SuppressWarnings("unchecked")
        Map<String, Object> track = (Map<String, Object>) body.get("currentTrack");
        boolean isPlaying = Boolean.TRUE.equals(body.get("isPlaying"));
        double currentTime = body.get("currentTime") instanceof Number
                ? ((Number) body.get("currentTime")).doubleValue() : 0.0;

        JamStateDto updated = jamSyncService.updatePlaybackState(roomCode, user, track, isPlaying, currentTime);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/state/{roomCode}")
    public ResponseEntity<JamStateDto> getRoomState(@PathVariable String roomCode) {
        JamStateDto state = jamSyncService.getRoomState(roomCode);
        if (state == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(state);
    }

    @PostMapping("/reaction")
    public ResponseEntity<JamStateDto> sendReaction(@AuthenticationPrincipal UserDetails userDetails,
                                                     @RequestBody Map<String, String> body) {
        String username = body.get("username") != null ? body.get("username") : "Friend";
        User user = resolveUser(userDetails, username);
        String roomCode = body.get("roomCode");
        String emoji = body.get("emoji");
        JamStateDto updated = jamSyncService.addReaction(roomCode, user, emoji);
        return ResponseEntity.ok(updated);
    }
}
