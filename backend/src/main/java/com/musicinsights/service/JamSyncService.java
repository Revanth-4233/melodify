package com.musicinsights.service;

import com.musicinsights.dto.JamStateDto;
import com.musicinsights.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class JamSyncService {

    private static final Logger log = LoggerFactory.getLogger(JamSyncService.class);
    private final Map<String, JamStateDto> activeRooms = new ConcurrentHashMap<>();

    /**
     * Create a new Live Jam Session Room
     */
    public JamStateDto createRoom(User hostUser) {
        String roomCode = "JAM-" + (1000 + new Random().nextInt(9000));
        while (activeRooms.containsKey(roomCode)) {
            roomCode = "JAM-" + (1000 + new Random().nextInt(9000));
        }

        List<String> connected = new CopyOnWriteArrayList<>();
        connected.add(hostUser.getUsername());

        JamStateDto state = new JamStateDto(
                roomCode,
                hostUser.getUsername(),
                null,
                false,
                0.0,
                System.currentTimeMillis(),
                connected,
                new CopyOnWriteArrayList<>()
        );

        activeRooms.put(roomCode, state);
        log.info("🎧 [SONIC-SYNC] User '{}' created Jam Room: {}", hostUser.getUsername(), roomCode);
        return state;
    }

    /**
     * Join an existing Live Jam Session Room by Room Code / ID
     */
    public JamStateDto joinRoom(String roomCode, User joiningUser) {
        String formattedCode = roomCode.trim().toUpperCase();
        if (!formattedCode.startsWith("JAM-")) {
            formattedCode = "JAM-" + formattedCode;
        }

        JamStateDto state = activeRooms.get(formattedCode);
        if (state == null) {
            // If room code doesn't exist, auto-create a custom room ID for ease of use!
            List<String> connected = new CopyOnWriteArrayList<>();
            connected.add(joiningUser.getUsername());
            state = new JamStateDto(
                    formattedCode,
                    joiningUser.getUsername(),
                    null,
                    false,
                    0.0,
                    System.currentTimeMillis(),
                    connected,
                    new CopyOnWriteArrayList<>()
            );
            activeRooms.put(formattedCode, state);
        }

        if (!state.getConnectedUsers().contains(joiningUser.getUsername())) {
            state.getConnectedUsers().add(joiningUser.getUsername());
        }

        log.info("🔗 [SONIC-SYNC] User '{}' joined Jam Room: {}", joiningUser.getUsername(), formattedCode);
        return state;
    }

    /**
     * Broadcast live playback state update from Host
     */
    public JamStateDto updatePlaybackState(String roomCode, User user, Map<String, Object> currentTrack,
                                           boolean isPlaying, double currentTime) {
        JamStateDto state = activeRooms.get(roomCode);
        if (state == null) {
            state = joinRoom(roomCode, user);
        }

        state.setCurrentTrack(currentTrack);
        state.setPlaying(isPlaying);
        state.setCurrentTime(currentTime);
        state.setLastUpdatedTimestamp(System.currentTimeMillis());

        return state;
    }

    /**
     * Send live reaction emoji to all listeners in room
     */
    public JamStateDto addReaction(String roomCode, User user, String emoji) {
        JamStateDto state = activeRooms.get(roomCode);
        if (state != null) {
            String msg = user.getUsername() + ": " + emoji;
            state.getReactions().add(msg);
            if (state.getReactions().size() > 15) {
                state.getReactions().remove(0);
            }
        }
        return state;
    }

    /**
     * Get live state of Jam Room
     */
    public JamStateDto getRoomState(String roomCode) {
        return activeRooms.get(roomCode);
    }
}
