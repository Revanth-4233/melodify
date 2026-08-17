package com.musicinsights.service;

import com.musicinsights.dto.*;
import com.musicinsights.entity.LibraryItem;
import com.musicinsights.entity.User;
import com.musicinsights.exception.DuplicateResourceException;
import com.musicinsights.exception.ResourceNotFoundException;
import com.musicinsights.repository.LibraryItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LibraryServiceTest {

    @Mock
    private LibraryItemRepository libraryItemRepository;

    @InjectMocks
    private LibraryService libraryService;

    private User testUser;
    private LibraryItem testItem;
    private LibraryItemRequest testRequest;

    @BeforeEach
    void setUp() {
        testUser = new User("testuser", "test@example.com", "password");
        testUser.setId(1L);

        testItem = new LibraryItem();
        testItem.setId(1L);
        testItem.setUser(testUser);
        testItem.setAppleCatalogId(1440806041L);
        testItem.setTitle("Parachutes");
        testItem.setArtistName("Coldplay");
        testItem.setGenre("Alternative");
        testItem.setReleaseDate("2000-07-10T12:00:00Z");
        testItem.setTrackCount(10);
        testItem.setUserRating(5);
        testItem.setUserNotes("Classic album");
        testItem.setCreatedAt(LocalDateTime.now());
        testItem.setUpdatedAt(LocalDateTime.now());

        testRequest = new LibraryItemRequest();
        testRequest.setAppleCatalogId(1440806041L);
        testRequest.setTitle("Parachutes");
        testRequest.setArtistName("Coldplay");
        testRequest.setGenre("Alternative");
        testRequest.setReleaseDate("2000-07-10T12:00:00Z");
        testRequest.setTrackCount(10);
        testRequest.setUserRating(5);
        testRequest.setUserNotes("Classic album");
    }

    @Test
    void getUserLibrary_ReturnsPaginatedResults() {
        Page<LibraryItem> page = new PageImpl<>(List.of(testItem));
        when(libraryItemRepository.findByUser(eq(testUser), any(Pageable.class)))
                .thenReturn(page);

        Page<LibraryItemResponse> result = libraryService.getUserLibrary(
                testUser, 0, 20, "createdAt", "desc");

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Parachutes", result.getContent().get(0).getTitle());
    }

    @Test
    void addToLibrary_Success() {
        when(libraryItemRepository.existsByUserAndAppleCatalogId(testUser, 1440806041L))
                .thenReturn(false);
        when(libraryItemRepository.save(any(LibraryItem.class))).thenReturn(testItem);

        LibraryItemResponse response = libraryService.addToLibrary(testUser, testRequest);

        assertNotNull(response);
        assertEquals("Parachutes", response.getTitle());
        assertEquals("Coldplay", response.getArtistName());
        assertEquals(5, response.getUserRating());
        verify(libraryItemRepository).save(any(LibraryItem.class));
    }

    @Test
    void addToLibrary_Duplicate_ThrowsException() {
        when(libraryItemRepository.existsByUserAndAppleCatalogId(testUser, 1440806041L))
                .thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> libraryService.addToLibrary(testUser, testRequest));
        verify(libraryItemRepository, never()).save(any());
    }

    @Test
    void updateLibraryItem_Success() {
        LibraryItemUpdateRequest updateRequest = new LibraryItemUpdateRequest();
        updateRequest.setUserRating(4);
        updateRequest.setUserNotes("Updated notes");

        when(libraryItemRepository.findByIdAndUser(1L, testUser))
                .thenReturn(Optional.of(testItem));
        when(libraryItemRepository.save(any(LibraryItem.class))).thenReturn(testItem);

        LibraryItemResponse response = libraryService.updateLibraryItem(
                testUser, 1L, updateRequest);

        assertNotNull(response);
        verify(libraryItemRepository).save(any(LibraryItem.class));
    }

    @Test
    void updateLibraryItem_NotFound_ThrowsException() {
        when(libraryItemRepository.findByIdAndUser(999L, testUser))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> libraryService.updateLibraryItem(testUser, 999L,
                        new LibraryItemUpdateRequest()));
    }

    @Test
    void deleteLibraryItem_Success() {
        when(libraryItemRepository.findByIdAndUser(1L, testUser))
                .thenReturn(Optional.of(testItem));

        libraryService.deleteLibraryItem(testUser, 1L);

        verify(libraryItemRepository).delete(testItem);
    }

    @Test
    void deleteLibraryItem_NotFound_ThrowsException() {
        when(libraryItemRepository.findByIdAndUser(999L, testUser))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> libraryService.deleteLibraryItem(testUser, 999L));
    }
}
