package com.musicplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class MusicPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(MusicPlatformApplication.class, args);
    }
}
