package com.musicinsights.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AutoSyncSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(AutoSyncSchedulerService.class);
    private final ItunesProxyService itunesProxyService;

    public AutoSyncSchedulerService(ItunesProxyService itunesProxyService) {
        this.itunesProxyService = itunesProxyService;
    }

    /**
     * Automatic Background Sync Service
     * Runs every hour to fetch and auto-sync top trending Telugu, Tamil, and Indian songs.
     */
    @Scheduled(cron = "0 0 * * * *") // Runs at the start of every hour
    public void autoSyncNewReleases() {
        log.info("🚀 [AUTO-SYNC] Starting automatic new release ingestion scheduler...");

        List<String> syncQueries = List.of(
                "Telugu",
                "Tamil Hits",
                "Sid Sriram Telugu",
                "Anirudh Ravichander",
                "Devi Sri Prasad",
                "Thaman S",
                "A.R. Rahman"
        );

        for (String query : syncQueries) {
            try {
                itunesProxyService.search(query, 25);
                log.info("✅ [AUTO-SYNC] Successfully synced latest releases for query: '{}'", query);
            } catch (Exception e) {
                log.error("⚠️ [AUTO-SYNC] Failed to auto-sync query '{}': {}", query, e.getMessage());
            }
        }

        log.info("✨ [AUTO-SYNC] Automatic new release ingestion complete!");
    }
}
