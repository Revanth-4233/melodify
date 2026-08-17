package com.musicinsights.controller;

import com.musicinsights.dto.*;
import com.musicinsights.entity.User;
import com.musicinsights.service.AuthService;
import com.musicinsights.service.LibraryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/library")
public class LibraryController {

    private final LibraryService libraryService;
    private final AuthService authService;

    public LibraryController(LibraryService libraryService, AuthService authService) {
        this.libraryService = libraryService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<Page<LibraryItemResponse>> getLibrary(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        User user = authService.getCurrentUser(userDetails.getUsername());
        Page<LibraryItemResponse> library = libraryService.getUserLibrary(
                user, page, size, sortBy, direction);
        return ResponseEntity.ok(library);
    }

    @PostMapping
    public ResponseEntity<LibraryItemResponse> addToLibrary(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody LibraryItemRequest request) {

        User user = authService.getCurrentUser(userDetails.getUsername());
        LibraryItemResponse response = libraryService.addToLibrary(user, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LibraryItemResponse> updateLibraryItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody LibraryItemUpdateRequest request) {

        User user = authService.getCurrentUser(userDetails.getUsername());
        LibraryItemResponse response = libraryService.updateLibraryItem(user, id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteLibraryItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {

        User user = authService.getCurrentUser(userDetails.getUsername());
        libraryService.deleteLibraryItem(user, id);
        return ResponseEntity.ok(Map.of("message", "Album removed from library successfully"));
    }
}
