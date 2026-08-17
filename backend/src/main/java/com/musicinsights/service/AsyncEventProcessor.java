package com.musicinsights.service;

import com.musicinsights.entity.PlayEvent;
import com.musicinsights.repository.PlayEventRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

@Service
public class AsyncEventProcessor {

    private static final Logger log = LoggerFactory.getLogger(AsyncEventProcessor.class);
    
    // An in-memory queue to absorb sudden spikes (e.g., 100,000 requests) instantly.
    private final BlockingQueue<PlayEvent> eventQueue = new LinkedBlockingQueue<>(200000);
    private final PlayEventRepository playEventRepository;
    
    private Thread processorThread;
    private volatile boolean running = true;

    public AsyncEventProcessor(PlayEventRepository playEventRepository) {
        this.playEventRepository = playEventRepository;
    }

    /**
     * Instantly queues the event in memory without blocking the HTTP thread.
     * Response time: ~0ms
     */
    public void enqueuePlayEvent(PlayEvent event) {
        if (!eventQueue.offer(event)) {
            log.warn("High Load: PlayEvent queue is full. Dropping event to prevent memory crash.");
        }
    }

    @PostConstruct
    public void startProcessing() {
        processorThread = new Thread(() -> {
            log.info("Started AsyncEventProcessor Background Thread for High Scalability Batching.");
            List<PlayEvent> batch = new ArrayList<>(1000);
            
            while (running || !eventQueue.isEmpty()) {
                try {
                    // Try to drain up to 1000 events or block if empty
                    PlayEvent firstEvent = eventQueue.poll(5, java.util.concurrent.TimeUnit.SECONDS);
                    
                    if (firstEvent != null) {
                        batch.add(firstEvent);
                        eventQueue.drainTo(batch, 999);
                        
                        // Bulk insert 1000 events in a single database transaction
                        playEventRepository.saveAll(batch);
                        log.debug("Flushed batch of {} play events to DB", batch.size());
                        batch.clear();
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    log.error("AsyncEventProcessor thread interrupted", e);
                } catch (Exception e) {
                    log.error("Failed to save batch of events", e);
                    batch.clear(); // Clear on failure to prevent infinite retry loops that block new data
                }
            }
        });
        
        processorThread.setName("PlayEvent-Batch-Processor");
        processorThread.setDaemon(true);
        processorThread.start();
    }

    @PreDestroy
    public void stopProcessing() {
        running = false;
        if (processorThread != null) {
            processorThread.interrupt();
        }
    }
}
