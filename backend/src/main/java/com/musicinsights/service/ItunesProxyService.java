package com.musicinsights.service;

import com.musicinsights.entity.LibraryItem;
import com.musicinsights.entity.User;
import com.musicinsights.repository.LibraryItemRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ItunesProxyService {

    private final RestTemplate restTemplate;
    private final LibraryItemRepository libraryItemRepository;

    @Value("${itunes.api.base-url}")
    private String baseUrl;

    public ItunesProxyService(RestTemplate restTemplate,
                              LibraryItemRepository libraryItemRepository) {
        this.restTemplate = restTemplate;
        this.libraryItemRepository = libraryItemRepository;
    }

    @Cacheable(value = "itunesSearch", key = "#query + '_' + #limit")
    public Map<String, Object> search(String query, int limit) {
        return search(query, limit, "album");
    }

    @Cacheable(value = "itunesSearch", key = "#query + '_' + #limit + '_' + #entity")
    public Map<String, Object> search(String query, int limit, String entity) {
        String url = String.format("%s/search?term=%s&entity=%s&limit=%d",
                baseUrl, query, entity, limit);

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        return response != null ? response : Collections.emptyMap();
    }

    public Map<String, Object> searchWithLibraryFlags(String query, int limit, User user) {
        return searchWithLibraryFlags(query, limit, "album", user);
    }

    public Map<String, Object> searchWithLibraryFlags(String query, int limit, String entity, User user) {
        Map<String, Object> response = search(query, limit, entity);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");

        if (results != null && !results.isEmpty()) {
            // Extract all collection IDs from search results
            List<Long> catalogIds = results.stream()
                    .map(r -> {
                        Object id = r.get("collectionId");
                        if (id instanceof Number) {
                            return ((Number) id).longValue();
                        }
                        return null;
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            // Find which ones are already in user's library
            List<LibraryItem> existingItems =
                    libraryItemRepository.findByUserAndAppleCatalogIdIn(user, catalogIds);
            Set<Long> savedIds = existingItems.stream()
                    .map(LibraryItem::getAppleCatalogId)
                    .collect(Collectors.toSet());

            // Enrich results with inLibrary flag
            for (Map<String, Object> result : results) {
                Object id = result.get("collectionId");
                if (id instanceof Number) {
                    result.put("inLibrary", savedIds.contains(((Number) id).longValue()));
                } else {
                    result.put("inLibrary", false);
                }
            }
        }

        return response;
    }

    public Map<String, Object> lookup(Long id) {
        String url = String.format("%s/lookup?id=%d", baseUrl, id);

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        return response != null ? response : Collections.emptyMap();
    }

    @Cacheable(value = "itunesSearch", key = "'tracks_' + #id")
    public Map<String, Object> getAlbumTracks(Long id) {
        String url = String.format("%s/lookup?id=%d&entity=song", baseUrl, id);

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        return response != null ? response : Collections.emptyMap();
    }
}
