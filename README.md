# 🎵 Melodify - Music Catalog Insights Platform

Melodify is a premium, full-stack web application designed to let users explore a massive public music catalog, curate a personal music library, view analytics on their listening habits, and receive personalized, AI-driven insights into their music taste.

## ✨ Features

- **Public Catalog Search**: Search the global iTunes database for artists, albums, and songs. 
- **Global Audio Player**: Listen to 30-second official audio previews seamlessly via a persistent global player sidebar.
- **Personal Library**: Authenticated users can save songs to their personal library, rate them, and add personal notes.
- **Advanced Analytics**: Visualizes the user's library statistics (top genres, decades, artist distribution) using beautiful interactive charts.
- **AI-Driven Insights**: Integrates with Google Gemini AI to analyze the user's saved library and generate personalized recommendations and music taste profiling.

---

## 🏗️ Architecture & Entity Design

### Database Schema & Entity Choice
The application utilizes a relational database (PostgreSQL/MySQL) with a streamlined, two-entity architecture designed for rapid iteration and decoupled metadata:

1. **`users` Table**: Manages authentication and identity. Contains `username`, `email`, and a BCrypt-hashed `password`.
2. **`saved_albums` Table**: Represents the user's personal library. It has a Many-to-One relationship with the `users` table.

**Schema Design Choice:** 
Instead of creating a complex normalized web of `Artists`, `Albums`, and `Tracks` tables, the `saved_albums` table acts as a localized cache of the iTunes API metadata (storing `artistName`, `collectionName`, `artworkUrl`, `genre`, etc.) directly alongside user-specific data (`userRating` and `userNotes`). 

### ⚖️ Technical Trade-offs

1. **Denormalized Library vs. Normalized Catalog:**
   * *Trade-off*: By storing iTunes metadata directly in the `saved_albums` table, we duplicate data if two users save the exact same song.
   * *Benefit*: It entirely eliminates the need for complex JOINs. Fetching a user's library is a single, lightning-fast query. It also insulates the app from iTunes API rate limits, as we only query iTunes during the initial search, not when loading the library.
2. **Stateless JWT Authentication vs. Stateful Sessions:**
   * *Trade-off*: JWTs cannot easily be invalidated on the server before they expire (without maintaining a blacklist, which defeats the purpose of being stateless).
   * *Benefit*: Complete decoupling of the Next.js frontend and Spring Boot backend. The backend scales horizontally without needing sticky sessions or a centralized Redis session store.
3. **Client-Side vs. Server-Side Analytics Calculation:**
   * *Trade-off*: Analytics (genres, decades) are calculated on the backend (`AnalyticsService`) and served via a DTO, rather than pushing raw data to the frontend for calculation.
   * *Benefit*: Reduces the JSON payload size sent over the network and centralizes business logic, making it easier to add mobile clients in the future.

---

## 🤖 AI Feature Implementation

The platform integrates with the **Google Gemini API** to provide "Music Aura" insights. 
- **How it works**: When a user requests insights, the backend aggregates their library data (extracting all unique genres, top artists, and release decades).
- **Prompt Engineering**: This aggregated profile is injected into a strict system prompt instructing Gemini to act as a professional music critic. The prompt forces Gemini to return a precisely structured JSON response.
- **Output**: The AI generates a customized psychological profile of their music taste, predicts niche subgenres they might like, and recommends three specific songs (not currently in their library) that match their vibe.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js (App Router), React, Vanilla CSS, Recharts
- **Backend**: Java 17, Spring Boot 3, Spring Security (JWT)
- **Database**: PostgreSQL (Render) / MySQL (Local), Spring Data JPA, Hibernate
- **APIs**: iTunes Search API, Google Gemini AI

---

## 🚀 Setup & Installation

### Prerequisites
- Java 17+ and Node.js 18+
- MySQL or PostgreSQL database

### 1. Database Setup
Create a fresh local database:
```sql
CREATE DATABASE melodify;
```

### 2. Backend Setup
Navigate to the `backend` directory. Open `src/main/resources/application.yml` and add your database credentials and Gemini API key (`app.gemini.api-key`).

Run the Spring Boot server (Hibernate will automatically generate the schema):
```bash
mvn clean compile spring-boot:run
```

### 3. Frontend Setup
Navigate to the `frontend` directory, install dependencies, and run the server:
```bash
npm install
npm run dev
```

### 4. Render Deployment (Cloud)
This repository includes a `render.yaml` Blueprint and `Dockerfile`. 
To deploy, connect this repository to a Render account. It will automatically provision a free PostgreSQL database, build the Spring Boot Docker container, and deploy the Next.js frontend.
