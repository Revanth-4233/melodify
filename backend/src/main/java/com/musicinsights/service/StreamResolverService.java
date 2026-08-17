package com.musicinsights.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class StreamResolverService {

    private static final Logger log = LoggerFactory.getLogger(StreamResolverService.class);
    private final RestTemplate restTemplate;

    public StreamResolverService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String decryptJioSaavnUrl(String encryptedUrl) {
        if (encryptedUrl == null || encryptedUrl.trim().isEmpty()) return null;
        try {
            String key = "38346591";
            javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec(key.getBytes(), "DES");
            javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance("DES/ECB/PKCS5Padding");
            cipher.init(javax.crypto.Cipher.DECRYPT_MODE, secretKey);
            byte[] decodedBytes = java.util.Base64.getDecoder().decode(encryptedUrl);
            byte[] decryptedBytes = cipher.doFinal(decodedBytes);
            String decryptedUrl = new String(decryptedBytes);
            return decryptedUrl.replace("_96.mp4", "_320.mp4").replace("_160.mp4", "_320.mp4");
        } catch (Exception e) {
            log.warn("Decryption failed for URL: {}", e.getMessage());
            return null;
        }
    }

    private String normalize(String title) {
        if (title == null) return "";
        return title.toLowerCase()
                .replaceAll("(?i)\\(from.*?\\)", "")
                .replaceAll("\\[.*?\\]", "")
                .replaceAll("(?i)feat\\..*", "")
                .replaceAll("[^a-z0-9]", "")
                .trim();
    }

    private boolean isTitleMatch(String requestedTitle, String resultTitle, String resultAlbum) {
        String normReq = normalize(requestedTitle);
        String normResTitle = normalize(resultTitle);
        String normResAlbum = normalize(resultAlbum);

        if (normReq.isEmpty()) return true;

        if (!normResTitle.isEmpty() && (normResTitle.equals(normReq) || normResTitle.contains(normReq) || normReq.contains(normResTitle))) {
            return true;
        }

        if (!normResAlbum.isEmpty() && (normResAlbum.equals(normReq) || normResAlbum.contains(normReq) || normReq.contains(normResAlbum))) {
            return true;
        }

        return isFuzzy(normReq, normResTitle) || isFuzzy(normReq, normResAlbum);
    }

    private boolean isFuzzy(String normReq, String candidate) {
        if (normReq.isEmpty() || candidate.isEmpty()) return false;
        String shorter = normReq.length() <= candidate.length() ? normReq : candidate;
        String longer = normReq.length() > candidate.length() ? normReq : candidate;
        
        int matchCount = 0;
        int longerIdx = 0;
        for (int i = 0; i < shorter.length() && longerIdx < longer.length(); i++) {
            int found = longer.indexOf(shorter.charAt(i), longerIdx);
            if (found >= 0) {
                matchCount++;
                longerIdx = found + 1;
            }
        }
        return ((double) matchCount / shorter.length()) >= 0.5;
    }

    @Cacheable(value = "fullStreamUrl", key = "#trackName + '_' + #artistName + '_' + #collectionName + '_' + #targetLang")
    public Map<String, Object> resolveFullStream(String trackName, String artistName, String collectionName, String targetLang) {
        if (trackName == null || trackName.trim().isEmpty()) {
            return Collections.emptyMap();
        }

        String cleanTrack = trackName
                .replaceAll("(?i)\\(From.*?\\)", "")
                .replaceAll("(?i)\\(Original Motion Picture Soundtrack.*?\\)", "")
                .replaceAll("\\[.*?\\]", "")
                .replaceAll("(?i)feat\\..*", "")
                .trim();

        String cleanCollection = (collectionName != null) 
                ? collectionName.replaceAll("(?i)\\(From.*?\\)", "").replaceAll("\\[.*?\\]", "").trim() 
                : "";

        String mainArtist = (artistName != null && !artistName.trim().isEmpty()) 
                ? artistName.split(",")[0].trim() 
                : "";

        String preferredLanguage = (targetLang != null && !targetLang.trim().isEmpty()) ? targetLang.toLowerCase().trim() : "telugu";
        if (cleanTrack.toLowerCase().contains("hindi") || (artistName != null && artistName.toLowerCase().contains("hindi"))) {
            preferredLanguage = "hindi";
        } else if (cleanTrack.toLowerCase().contains("tamil") || (artistName != null && artistName.toLowerCase().contains("tamil"))) {
            preferredLanguage = "tamil";
        }

        List<String> searchQueries = new ArrayList<>();
        if (!cleanCollection.isEmpty() && !cleanCollection.equalsIgnoreCase(cleanTrack)) {
            searchQueries.add(cleanTrack + " " + cleanCollection);
        }
        if (!mainArtist.isEmpty()) {
            searchQueries.add(cleanTrack + " " + mainArtist);
        }
        searchQueries.add(cleanTrack);

        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

        for (String q : searchQueries) {
            String encodedQuery = URLEncoder.encode(q, StandardCharsets.UTF_8);

            // Method 1: JioSaavn Direct search.getResults API
            try {
                String searchUrl = "https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&p=1&n=15&q=" + encodedQuery;
                String searchJson = restTemplate.getForObject(searchUrl, String.class);
                if (searchJson != null && searchJson.contains("results")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> searchResp = mapper.readValue(searchJson, Map.class);
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> results = (List<Map<String, Object>>) searchResp.get("results");
                    if (results != null && !results.isEmpty()) {
                        
                        // Pass 1: Match title/album AND match preferred language (e.g. Telugu)
                        for (Map<String, Object> item : results) {
                            String resTitle = (String) item.getOrDefault("song", "");
                            String resAlbum = (String) item.getOrDefault("album", "");
                            String resLang = (String) item.getOrDefault("language", "");
                            String encUrl = (String) item.get("encrypted_media_url");

                            if (isTitleMatch(cleanTrack, resTitle, resAlbum) && encUrl != null) {
                                if (resLang.equalsIgnoreCase(preferredLanguage) || preferredLanguage.isEmpty()) {
                                    String streamUrl = decryptJioSaavnUrl(encUrl);
                                    if (streamUrl != null) {
                                        Object durObj = item.get("duration");
                                        int duration = durObj != null ? Integer.parseInt(durObj.toString()) : 240;
                                        log.info("🎵 [STREAM-RESOLVER] Resolved 320kbps via JioSaavn search.getResults for '{}' [Lang: {}] (matched: '{}'): {}", cleanTrack, resLang, resTitle, streamUrl);
                                        return Map.of("url", streamUrl, "duration", duration, "isFullLength", true, "songName", resTitle);
                                    }
                                }
                            }
                        }

                        // Pass 2: Match title/album (any language fallback)
                        for (Map<String, Object> item : results) {
                            String resTitle = (String) item.getOrDefault("song", "");
                            String resAlbum = (String) item.getOrDefault("album", "");
                            String encUrl = (String) item.get("encrypted_media_url");

                            if (isTitleMatch(cleanTrack, resTitle, resAlbum) && encUrl != null) {
                                String streamUrl = decryptJioSaavnUrl(encUrl);
                                if (streamUrl != null) {
                                    Object durObj = item.get("duration");
                                    int duration = durObj != null ? Integer.parseInt(durObj.toString()) : 240;
                                    log.info("🎵 [STREAM-RESOLVER] Resolved 320kbps via JioSaavn search.getResults (any lang) for '{}' (matched: '{}'): {}", cleanTrack, resTitle, streamUrl);
                                    return Map.of("url", streamUrl, "duration", duration, "isFullLength", true, "songName", resTitle);
                                }
                            }
                        }

                        // Pass 3: First result with valid encrypted URL
                        Map<String, Object> topItem = results.get(0);
                        String encUrl = (String) topItem.get("encrypted_media_url");
                        String resTitle = (String) topItem.getOrDefault("song", "");
                        if (encUrl != null) {
                            String streamUrl = decryptJioSaavnUrl(encUrl);
                            if (streamUrl != null) {
                                Object durObj = topItem.get("duration");
                                int duration = durObj != null ? Integer.parseInt(durObj.toString()) : 240;
                                log.info("🎵 [STREAM-RESOLVER] Top result fallback for '{}': {}", cleanTrack, streamUrl);
                                return Map.of("url", streamUrl, "duration", duration, "isFullLength", true, "songName", resTitle);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("JioSaavn search.getResults failed for '{}': {}", q, e.getMessage());
            }
        }

        // Method 2: Third party endpoints fallback
        for (String q : searchQueries) {
            String encodedQuery = URLEncoder.encode(q, StandardCharsets.UTF_8);
            List<String> endpoints = List.of(
                    "https://saavn-api.vercel.app/search/songs?query=" + encodedQuery
            );
            for (String url : endpoints) {
                try {
                    String rawResponse = restTemplate.getForObject(url, String.class);
                    if (rawResponse == null || rawResponse.trim().isEmpty()) continue;
                    
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> results = null;
                    
                    // Try parsing as flat array first (saavn-api.vercel.app format)
                    try {
                        results = mapper.readValue(rawResponse, List.class);
                    } catch (Exception ignored) {}
                    
                    // Try parsing as nested {data: {results: [...]}} format
                    if (results == null || results.isEmpty()) {
                        try {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> resp = mapper.readValue(rawResponse, Map.class);
                            if (resp.containsKey("data")) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> dataMap = (Map<String, Object>) resp.get("data");
                                if (dataMap != null && dataMap.containsKey("results")) {
                                    results = (List<Map<String, Object>>) dataMap.get("results");
                                }
                            }
                        } catch (Exception ignored) {}
                    }
                    
                    if (results != null && !results.isEmpty()) {
                        // Find best match by title
                        Map<String, Object> bestMatch = null;
                        for (Map<String, Object> item : results) {
                            String resTitle = (String) item.getOrDefault("title", item.getOrDefault("name", item.getOrDefault("song", "")));
                            String resAlbum = "";
                            Object albumObj = item.get("album");
                            if (albumObj instanceof String) {
                                resAlbum = (String) albumObj;
                            } else if (albumObj instanceof Map) {
                                resAlbum = (String) ((Map<String, Object>) albumObj).getOrDefault("name", "");
                            }
                            if (isTitleMatch(cleanTrack, resTitle, resAlbum)) {
                                bestMatch = item;
                                break;
                            }
                        }
                        if (bestMatch == null) bestMatch = results.get(0);
                        
                        String streamUrl = null;
                        Object durObj = bestMatch.get("duration");
                        int duration = durObj != null ? Integer.parseInt(durObj.toString()) : 240;
                        
                        // Shape 1: downloadUrl array
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> downloadUrls = (List<Map<String, Object>>) bestMatch.get("downloadUrl");
                        if (downloadUrls != null && !downloadUrls.isEmpty()) {
                            Map<String, Object> best = downloadUrls.get(downloadUrls.size() - 1);
                            streamUrl = (String) best.get("url");
                        }
                        
                        // Shape 2: Direct URL field (saavn-api.vercel.app)
                        if (streamUrl == null) {
                            String directUrl = (String) bestMatch.get("url");
                            if (directUrl != null && directUrl.contains(".saavncdn.com")) {
                                streamUrl = directUrl;
                            }
                        }
                        
                        // Ensure 320kbps
                        if (streamUrl != null) {
                            streamUrl = streamUrl
                                .replace("_96_p.mp4", "_320.mp4")
                                .replace("_96.mp4", "_320.mp4")
                                .replace("_160.mp4", "_320.mp4")
                                .replace("preview.saavncdn.com", "aac.saavncdn.com");
                            
                            String songName = (String) bestMatch.getOrDefault("title", 
                                bestMatch.getOrDefault("name", bestMatch.getOrDefault("song", cleanTrack)));
                            log.info("🎵 [STREAM-RESOLVER] Resolved via Saavn API for '{}': {}", cleanTrack, streamUrl);
                            return Map.of("url", streamUrl, "duration", duration, "isFullLength", true, "songName", songName);
                        }
                    }
                } catch (Exception e) {
                    log.warn("Third party endpoint failed for {}: {}", url, e.getMessage());
                }
            }
        }

        log.warn("[STREAM-RESOLVER] No matching stream found for '{}' by '{}'", cleanTrack, artistName);
        return Collections.emptyMap();
    }

    public Map<String, Object> resolveFullStream(String trackName, String artistName) {
        return resolveFullStream(trackName, artistName, "", "telugu");
    }
}

