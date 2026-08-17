package com.musicinsights.dto;

import java.util.List;
import java.util.Map;

public class JamStateDto {
    private String roomCode;
    private String hostUsername;
    private Map<String, Object> currentTrack;
    private boolean isPlaying;
    private double currentTime;
    private long lastUpdatedTimestamp;
    private List<String> connectedUsers;
    private List<String> reactions;

    public JamStateDto() {}

    public JamStateDto(String roomCode, String hostUsername, Map<String, Object> currentTrack,
                       boolean isPlaying, double currentTime, long lastUpdatedTimestamp,
                       List<String> connectedUsers, List<String> reactions) {
        this.roomCode = roomCode;
        this.hostUsername = hostUsername;
        this.currentTrack = currentTrack;
        this.isPlaying = isPlaying;
        this.currentTime = currentTime;
        this.lastUpdatedTimestamp = lastUpdatedTimestamp;
        this.connectedUsers = connectedUsers;
        this.reactions = reactions;
    }

    public String getRoomCode() { return roomCode; }
    public void setRoomCode(String roomCode) { this.roomCode = roomCode; }

    public String getHostUsername() { return hostUsername; }
    public void setHostUsername(String hostUsername) { this.hostUsername = hostUsername; }

    public Map<String, Object> getCurrentTrack() { return currentTrack; }
    public void setCurrentTrack(Map<String, Object> currentTrack) { this.currentTrack = currentTrack; }

    public boolean isPlaying() { return isPlaying; }
    public void setPlaying(boolean playing) { isPlaying = playing; }

    public double getCurrentTime() { return currentTime; }
    public void setCurrentTime(double currentTime) { this.currentTime = currentTime; }

    public long getLastUpdatedTimestamp() { return lastUpdatedTimestamp; }
    public void setLastUpdatedTimestamp(long lastUpdatedTimestamp) { this.lastUpdatedTimestamp = lastUpdatedTimestamp; }

    public List<String> getConnectedUsers() { return connectedUsers; }
    public void setConnectedUsers(List<String> connectedUsers) { this.connectedUsers = connectedUsers; }

    public List<String> getReactions() { return reactions; }
    public void setReactions(List<String> reactions) { this.reactions = reactions; }
}
