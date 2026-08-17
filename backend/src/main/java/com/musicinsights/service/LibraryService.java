package com.musicinsights.service;

import com.musicinsights.dto.*;
import com.musicinsights.entity.LibraryItem;
import com.musicinsights.entity.User;
import com.musicinsights.exception.DuplicateResourceException;
import com.musicinsights.exception.ResourceNotFoundException;
import com.musicinsights.repository.LibraryItemRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class LibraryService {

    private final LibraryItemRepository libraryItemRepository;

    public LibraryService(LibraryItemRepository libraryItemRepository) {
        this.libraryItemRepository = libraryItemRepository;
    }

    public Page<LibraryItemResponse> getUserLibrary(User user, int page, int size, String sortBy, String direction) {
        Sort sort = direction.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<LibraryItem> items = libraryItemRepository.findByUser(user, pageable);
        return items.map(this::toResponse);
    }

    public LibraryItemResponse addToLibrary(User user, LibraryItemRequest request) {
        if (libraryItemRepository.existsByUserAndAppleCatalogId(user, request.getAppleCatalogId())) {
            throw new DuplicateResourceException(
                    "Album already exists in your library: " + request.getTitle());
        }

        LibraryItem item = new LibraryItem();
        item.setUser(user);
        item.setAppleCatalogId(request.getAppleCatalogId());
        item.setTitle(request.getTitle());
        item.setArtistName(request.getArtistName());
        item.setGenre(request.getGenre());
        item.setReleaseDate(request.getReleaseDate());
        item.setTrackCount(request.getTrackCount());
        item.setArtworkUrl(request.getArtworkUrl());
        item.setCollectionPrice(request.getCollectionPrice());
        item.setUserRating(request.getUserRating());
        item.setUserNotes(request.getUserNotes());

        item = libraryItemRepository.save(item);
        return toResponse(item);
    }

    public LibraryItemResponse updateLibraryItem(User user, Long id, LibraryItemUpdateRequest request) {
        LibraryItem item = libraryItemRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Library item not found with id: " + id));

        if (request.getUserRating() != null) {
            item.setUserRating(request.getUserRating());
        }
        if (request.getUserNotes() != null) {
            item.setUserNotes(request.getUserNotes());
        }

        item = libraryItemRepository.save(item);
        return toResponse(item);
    }

    public void deleteLibraryItem(User user, Long id) {
        LibraryItem item = libraryItemRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Library item not found with id: " + id));

        libraryItemRepository.delete(item);
    }

    public LibraryItemResponse getLibraryItem(User user, Long id) {
        LibraryItem item = libraryItemRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Library item not found with id: " + id));
        return toResponse(item);
    }

    private LibraryItemResponse toResponse(LibraryItem item) {
        LibraryItemResponse response = new LibraryItemResponse();
        response.setId(item.getId());
        response.setAppleCatalogId(item.getAppleCatalogId());
        response.setTitle(item.getTitle());
        response.setArtistName(item.getArtistName());
        response.setGenre(item.getGenre());
        response.setReleaseDate(item.getReleaseDate());
        response.setTrackCount(item.getTrackCount());
        response.setArtworkUrl(item.getArtworkUrl());
        response.setCollectionPrice(item.getCollectionPrice());
        response.setUserRating(item.getUserRating());
        response.setUserNotes(item.getUserNotes());
        response.setCreatedAt(item.getCreatedAt());
        response.setUpdatedAt(item.getUpdatedAt());
        return response;
    }
}
