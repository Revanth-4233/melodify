package com.musicplatform.service;

import com.musicplatform.dto.SaveAlbumRequest;
import com.musicplatform.dto.UpdateAlbumRequest;
import com.musicplatform.exception.DuplicateResourceException;
import com.musicplatform.exception.ResourceNotFoundException;
import com.musicplatform.model.LibraryAlbum;
import com.musicplatform.repository.LibraryAlbumRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class LibraryService {

    private final LibraryAlbumRepository repository;

    public LibraryService(LibraryAlbumRepository repository) {
        this.repository = repository;
    }

    public Page<LibraryAlbum> getUserLibrary(Long userId, Pageable pageable) {
        return repository.findByUserId(userId, pageable);
    }

    public LibraryAlbum saveAlbum(Long userId, SaveAlbumRequest request) {
        if (repository.existsByUserIdAndAppleCatalogId(userId, request.getAppleCatalogId())) {
            throw new DuplicateResourceException("Album already exists in your library");
        }

        LocalDateTime releaseDate = null;
        if (request.getReleaseDate() != null && !request.getReleaseDate().isEmpty()) {
            try {
                releaseDate = LocalDateTime.parse(request.getReleaseDate(), DateTimeFormatter.ISO_DATE_TIME);
            } catch (Exception e) {
                try {
                    releaseDate = LocalDateTime.parse(request.getReleaseDate() + "T00:00:00");
                } catch (Exception ignored) {
                    // Leave as null if parsing fails
                }
            }
        }

        LibraryAlbum album = LibraryAlbum.builder()
                .userId(userId)
                .appleCatalogId(request.getAppleCatalogId())
                .title(request.getTitle())
                .artistName(request.getArtistName())
                .genre(request.getGenre())
                .releaseDate(releaseDate)
                .trackCount(request.getTrackCount())
                .artworkUrl(request.getArtworkUrl())
                .collectionPrice(request.getCollectionPrice())
                .userRating(request.getUserRating())
                .userNotes(request.getUserNotes())
                .build();

        return repository.save(album);
    }

    public LibraryAlbum updateAlbum(Long userId, Long albumId, UpdateAlbumRequest request) {
        LibraryAlbum album = repository.findByIdAndUserId(albumId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Album not found in your library"));

        if (request.getUserRating() != null) {
            album.setUserRating(request.getUserRating());
        }
        if (request.getUserNotes() != null) {
            album.setUserNotes(request.getUserNotes());
        }

        return repository.save(album);
    }

    public void deleteAlbum(Long userId, Long albumId) {
        LibraryAlbum album = repository.findByIdAndUserId(albumId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Album not found in your library"));

        repository.delete(album);
    }
}
