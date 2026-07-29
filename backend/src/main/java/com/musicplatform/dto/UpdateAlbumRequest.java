package com.musicplatform.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class UpdateAlbumRequest {

    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer userRating;

    private String userNotes;

    public Integer getUserRating() { return userRating; }
    public void setUserRating(Integer userRating) { this.userRating = userRating; }
    public String getUserNotes() { return userNotes; }
    public void setUserNotes(String userNotes) { this.userNotes = userNotes; }
}
