package com.musicplatform.service;

import com.musicplatform.dto.SaveAlbumRequest;
import com.musicplatform.dto.UpdateAlbumRequest;
import com.musicplatform.exception.DuplicateResourceException;
import com.musicplatform.exception.ResourceNotFoundException;
import com.musicplatform.model.LibraryAlbum;
import com.musicplatform.repository.LibraryAlbumRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LibraryServiceTest {

    @Mock
    private LibraryAlbumRepository repository;

    @InjectMocks
    private LibraryService libraryService;

    private Long userId;
    private SaveAlbumRequest saveRequest;
    private LibraryAlbum album;

    @BeforeEach
    void setUp() {
        userId = 1L;

        saveRequest = new SaveAlbumRequest();
        saveRequest.setAppleCatalogId(1440806041L);
        saveRequest.setTitle("Parachutes");
        saveRequest.setArtistName("Coldplay");
        saveRequest.setGenre("Alternative");
        saveRequest.setTrackCount(10);
        saveRequest.setCollectionPrice(BigDecimal.valueOf(9.99));

        album = LibraryAlbum.builder()
                .id(1L)
                .userId(userId)
                .appleCatalogId(1440806041L)
                .title("Parachutes")
                .artistName("Coldplay")
                .genre("Alternative")
                .trackCount(10)
                .collectionPrice(BigDecimal.valueOf(9.99))
                .build();
    }

    @Test
    void getUserLibrary_ShouldReturnPagedResults() {
        Page<LibraryAlbum> page = new PageImpl<>(List.of(album));
        when(repository.findByUserId(eq(userId), any(PageRequest.class))).thenReturn(page);

        Page<LibraryAlbum> result = libraryService.getUserLibrary(userId, PageRequest.of(0, 20));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Parachutes", result.getContent().get(0).getTitle());
    }

    @Test
    void saveAlbum_ShouldSaveSuccessfully() {
        when(repository.existsByUserIdAndAppleCatalogId(userId, saveRequest.getAppleCatalogId())).thenReturn(false);
        when(repository.save(any(LibraryAlbum.class))).thenReturn(album);

        LibraryAlbum result = libraryService.saveAlbum(userId, saveRequest);

        assertNotNull(result);
        assertEquals("Parachutes", result.getTitle());
        verify(repository).save(any(LibraryAlbum.class));
    }

    @Test
    void saveAlbum_ShouldThrowOnDuplicate() {
        when(repository.existsByUserIdAndAppleCatalogId(userId, saveRequest.getAppleCatalogId())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> libraryService.saveAlbum(userId, saveRequest));
    }

    @Test
    void updateAlbum_ShouldUpdateRatingAndNotes() {
        UpdateAlbumRequest updateRequest = new UpdateAlbumRequest();
        updateRequest.setUserRating(5);
        updateRequest.setUserNotes("Amazing album!");

        when(repository.findByIdAndUserId(1L, userId)).thenReturn(Optional.of(album));
        when(repository.save(any(LibraryAlbum.class))).thenReturn(album);

        LibraryAlbum result = libraryService.updateAlbum(userId, 1L, updateRequest);

        assertNotNull(result);
        verify(repository).save(any(LibraryAlbum.class));
    }

    @Test
    void updateAlbum_ShouldThrowWhenNotFound() {
        UpdateAlbumRequest updateRequest = new UpdateAlbumRequest();
        when(repository.findByIdAndUserId(99L, userId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> libraryService.updateAlbum(userId, 99L, updateRequest));
    }

    @Test
    void deleteAlbum_ShouldDeleteSuccessfully() {
        when(repository.findByIdAndUserId(1L, userId)).thenReturn(Optional.of(album));

        libraryService.deleteAlbum(userId, 1L);

        verify(repository).delete(album);
    }

    @Test
    void deleteAlbum_ShouldThrowWhenNotFound() {
        when(repository.findByIdAndUserId(99L, userId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> libraryService.deleteAlbum(userId, 99L));
    }
}
