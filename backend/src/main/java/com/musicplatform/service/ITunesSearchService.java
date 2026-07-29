package com.musicplatform.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@Service
public class ITunesSearchService {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public ITunesSearchService(@Value("${itunes.api.base-url}") String baseUrl) {
        this.restTemplate = new RestTemplate();
        org.springframework.http.converter.json.MappingJackson2HttpMessageConverter converter = new org.springframework.http.converter.json.MappingJackson2HttpMessageConverter();
        converter.setSupportedMediaTypes(java.util.Arrays.asList(org.springframework.http.MediaType.APPLICATION_JSON, new org.springframework.http.MediaType("text", "javascript")));
        this.restTemplate.getMessageConverters().add(0, converter);
        this.baseUrl = baseUrl;
    }

    @Cacheable(value = "itunesSearch", key = "#query + '_' + #entity + '_' + #limit")
    public Map<String, Object> search(String query, String entity, int limit) {
        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/search")
                .queryParam("term", query)
                .queryParam("entity", entity != null ? entity : "album")
                .queryParam("media", "music")
                .queryParam("limit", Math.min(limit, 200))
                .toUriString();

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        return response;
    }

    @Cacheable(value = "itunesLookup", key = "#id")
    public Map<String, Object> lookup(Long id) {
        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/lookup")
                .queryParam("id", id)
                .toUriString();

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        return response;
    }
}
