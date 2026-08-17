package com.musicinsights;

import com.musicinsights.repository.PlaylistRepository;
import com.musicinsights.repository.PlaylistSongRepository;
import com.musicinsights.entity.Playlist;
import com.musicinsights.service.PlaylistManagerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final PlaylistManagerService playlistManagerService;
    private final PlaylistRepository playlistRepository;
    private final PlaylistSongRepository playlistSongRepository;

    public DataSeeder(PlaylistManagerService playlistManagerService, PlaylistRepository playlistRepository, PlaylistSongRepository playlistSongRepository) {
        this.playlistManagerService = playlistManagerService;
        this.playlistRepository = playlistRepository;
        this.playlistSongRepository = playlistSongRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking for default curated playlists...");

        // Temporary: Clear existing to perfectly match the user's requested 8 default albums
        playlistSongRepository.deleteAllInBatch();
        playlistRepository.deleteAllInBatch();

        if (playlistRepository.count() == 0) {
            log.info("Starting background thread to generate default curated collections...");
            
            // Run seeding asynchronously so it doesn't block Spring Boot startup and cause cloud healthcheck timeouts
            new Thread(() -> {
                try {
                    playlistManagerService.createOrUpdateCuratedPlaylist(
                        "Instagram trending top telugu songs fresh hits | 2026", 
                        "telugu hits 2024"
                    );
                    
                    playlistManagerService.createOrUpdateCuratedPlaylist(
                        "Oh Sita Hey Rama [From \"Sita Ramam (Telugu)\"]", 
                        "sita ramam telugu hit"
                    );
                    
                    playlistManagerService.createOrUpdateCuratedPlaylist(
                        "TELUGU MELODIES \uD83C\uDFB6 \uD83D\uDC96", 
                        "sid sriram telugu"
                    );
                    
                    Playlist liked = new Playlist();
                    liked.setTitle("Liked Songs");
                    liked.setType("CURATED");
                    playlistRepository.save(liked);
                    
                    playlistManagerService.createOrUpdateCuratedPlaylist(
                        "Golden Sparrow \uD83D\uDC96", 
                        "golden sparrow anirudh"
                    );
                    
                    playlistManagerService.createOrUpdateCuratedPlaylist(
                        "Trending Telugu Songs 2026 - Best Telugu Viral Songs", 
                        "pushpa 2 telugu"
                    );
                    
                    playlistManagerService.createOrUpdateCuratedPlaylist(
                        "Mana Shankara Vara Prasad Garu Telegu Songs, Meesaa...", 
                        "devi sri prasad telugu"
                    );
                    
                    // Note: Skipping massive 100-track auto-generation on startup to save memory.
                    // The scheduled cron jobs will handle these later.
                    
                    log.info("Successfully seeded default curated playlists in background!");
                } catch (Exception e) {
                    log.error("Error during background seeding", e);
                }
            }, "DataSeeder-Thread").start();

        } else {
            log.info("Playlists already exist. Skipping default seeder.");
        }
    }
}
