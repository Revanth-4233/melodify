package com.musicplatform.service;

import com.musicplatform.dto.AIInsightsResponse;
import com.musicplatform.model.LibraryAlbum;
import com.musicplatform.repository.LibraryAlbumRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AIInsightsServiceTest {

    @Mock
    private LibraryAlbumRepository repository;

    @InjectMocks
    private AIInsightsService aiInsightsService;

    @Test
    void generateInsights_EmptyLibrary_ShouldReturnEmptyMessage() {
        when(repository.findByUserId(1L)).thenReturn(Collections.emptyList());

        AIInsightsResponse result = aiInsightsService.generateInsights(1L);

        assertNotNull(result);
        assertTrue(result.getSummary().contains("empty"));
        assertNull(result.getProfile());
    }

    @Test
    void generateInsights_WithAlbums_ShouldReturnInsights() {
        List<LibraryAlbum> albums = List.of(
                LibraryAlbum.builder()
                        .id(1L).userId(1L).appleCatalogId(100L)
                        .title("Parachutes").artistName("Coldplay")
                        .genre("Alternative")
                        .releaseDate(LocalDateTime.of(2000, 7, 10, 0, 0))
                        .userRating(5)
                        .collectionPrice(BigDecimal.valueOf(9.99))
                        .build(),
                LibraryAlbum.builder()
                        .id(2L).userId(1L).appleCatalogId(200L)
                        .title("A Rush of Blood to the Head").artistName("Coldplay")
                        .genre("Alternative")
                        .releaseDate(LocalDateTime.of(2002, 8, 26, 0, 0))
                        .userRating(4)
                        .collectionPrice(BigDecimal.valueOf(9.99))
                        .build(),
                LibraryAlbum.builder()
                        .id(3L).userId(1L).appleCatalogId(300L)
                        .title("21").artistName("Adele")
                        .genre("Pop")
                        .releaseDate(LocalDateTime.of(2011, 1, 24, 0, 0))
                        .userRating(5)
                        .collectionPrice(BigDecimal.valueOf(11.99))
                        .build()
        );

        when(repository.findByUserId(1L)).thenReturn(albums);

        AIInsightsResponse result = aiInsightsService.generateInsights(1L);

        assertNotNull(result);
        assertNotNull(result.getSummary());
        assertFalse(result.getInsights().isEmpty());
        assertFalse(result.getRecommendations().isEmpty());
        assertNotNull(result.getProfile());
        assertEquals("Alternative", result.getProfile().getDominantGenre());
        assertEquals("Coldplay", result.getProfile().getFavoriteArtist());
        assertEquals(2, result.getProfile().getTotalUniqueArtists());
        assertEquals(2, result.getProfile().getTotalUniqueGenres());
    }
}
