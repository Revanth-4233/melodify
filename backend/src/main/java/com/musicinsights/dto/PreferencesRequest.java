package com.musicinsights.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.List;

public class PreferencesRequest {

    @NotBlank
    private String fullName;
    
    private LocalDate dateOfBirth;
    
    private List<String> preferredLanguages;
    
    private List<String> preferredArtists;

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public List<String> getPreferredLanguages() {
        return preferredLanguages;
    }

    public void setPreferredLanguages(List<String> preferredLanguages) {
        this.preferredLanguages = preferredLanguages;
    }

    public List<String> getPreferredArtists() {
        return preferredArtists;
    }

    public void setPreferredArtists(List<String> preferredArtists) {
        this.preferredArtists = preferredArtists;
    }
}
