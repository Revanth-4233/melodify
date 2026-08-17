# 🎵 SonicVault — Music Catalog Insights Platform

A full-stack web application that lets users search the iTunes music catalog, save albums to a personal library, view rich analytics, and get AI-powered music taste insights.

![Tech Stack](https://img.shields.io/badge/Backend-Spring%20Boot%203.4-green?style=flat-square)
![Frontend](https://img.shields.io/badge/Frontend-React%20+%20Vite-blue?style=flat-square)
![Database](https://img.shields.io/badge/Database-MySQL%208.0-orange?style=flat-square)
![Auth](https://img.shields.io/badge/Auth-JWT-purple?style=flat-square)

---

## 📋 Table of Contents

- [Entity Choice & Rationale](#-entity-choice--rationale)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [AI Feature](#-ai-feature)
- [Setup & Run Locally](#-setup--run-locally)
- [Architecture](#-architecture)
- [Trade-offs & Design Decisions](#-trade-offs--design-decisions)

---

## 🎯 Entity Choice & Rationale

**Chosen Entity: Albums**

### Why Albums?

- **Rich Metadata**: Albums from iTunes provide structured data (`collectionName`, `artistName`, `primaryGenreName`, `releaseDate`, `trackCount`, `collectionPrice`, `artworkUrl100`) that enables deep, multi-dimensional analytics.
- **Analytical Depth**: Release dates enable temporal analysis (releases by year, decade trends), genres power categorical breakdowns, and track counts/prices add numerical dimensions.
- **AI Suitability**: Album collections reveal listening personas, genre preferences, era affinities, and taste patterns far better than individual songs.
- **User Intent**: Users curate album libraries as intentional artistic choices, making ratings and notes more meaningful than individual track ratings.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Java 17 + Spring Boot 3.4 | REST API, business logic, security |
| **Frontend** | React 19 + Vite | SPA with modern UI |
| **Database** | MySQL 8.0 | Persistent relational storage |
| **Auth** | JWT (jjwt 0.12.x) | Stateless authentication |
| **Charts** | Chart.js + react-chartjs-2 | Analytics visualization |
| **Icons** | Lucide React | Lightweight icon library |
| **Styling** | Vanilla CSS (Glassmorphism) | Custom dark theme design system |
| **API** | iTunes Search API | Public music catalog data |

---

## ✨ Features

### 🔍 Search & Discovery
- Proxy search against iTunes Search API (`entity=album`)
- 300ms debounced input to reduce API calls (Good-to-Have)
- Server-side caching of search results (Good-to-Have)
- "In Library" badge on search results already saved

### 📚 Personal Library
- Add albums with custom star ratings (1-5) and personal notes
- Edit ratings and notes via modal
- Delete albums with confirmation dialog
- Client-side filtering by title, artist, or genre
- Server-side sorting and pagination (Good-to-Have)
- Duplicate prevention (unique constraint on `user_id + apple_catalog_id`)

### 📊 Analytics Dashboard (4+ Charts)
1. **Genre Distribution** — Donut Chart
2. **Rating Distribution** — Bar Chart / Histogram (1-5 stars)
3. **Album Releases by Year** — Line/Area Chart
4. **Top Artists** — Horizontal Bar Chart
5. **KPI Summary Cards** — Total Albums, Average Rating, Top Genre, Favorite Decade

### 🧠 AI Feature: SonicMind Music Intelligence
- **Listener Persona** — Algorithmically determines archetype (Eclectic Voyager, Balanced Connoisseur, Genre Devotee)
- **Mood Profile** — Maps dominant genre to emotional signature
- **Era Analysis** — Identifies preferred decade with contextual music history
- **Genre Intelligence** — Calculates genre concentration and diversity metrics
- **Album Recommendations** — Genre-aware suggestions filtered against existing library
- **Hidden Gems** — Identifies rare genre entries and top-rated albums
- **Trend Summary** — Full library overview with concentration and rating analysis

### 🔐 Authentication
- JWT-based stateless authentication
- BCrypt password hashing
- Register / Login with validation
- Protected routes on frontend and backend

---

## 🗄 Database Schema

### Why SQL (MySQL)?

- **Structured Data**: Library items have consistent, well-defined fields ideal for relational modeling.
- **ACID Compliance**: Rating/note edits require transactional guarantees.
- **Aggregation**: SQL `GROUP BY`, `COUNT`, `AVG` queries power real-time analytics efficiently.
- **Indexing**: Multi-column indexes on `(user_id, apple_catalog_id)` ensure fast lookups and duplicate prevention.

### Tables

```sql
-- Users table
CREATE TABLE users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    password        VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Library items table
CREATE TABLE library_items (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    apple_catalog_id    BIGINT NOT NULL,
    title               VARCHAR(255) NOT NULL,
    artist_name         VARCHAR(255) NOT NULL,
    genre               VARCHAR(100) NOT NULL,
    release_date        VARCHAR(50),
    track_count         INT,
    artwork_url         VARCHAR(500),
    collection_price    DOUBLE,
    user_rating         INT CHECK (user_rating BETWEEN 1 AND 5),
    user_notes          TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY uk_user_catalog (user_id, apple_catalog_id)
);
```

---

## 📡 API Reference

### Authentication (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login and get JWT |
| `GET` | `/api/auth/me` | Get current user profile |

### Search (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/search?query={term}&limit={n}` | Search iTunes albums |

### Library CRUD (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/library?page=0&size=20&sortBy=createdAt&direction=desc` | Get saved library (paginated) |
| `POST` | `/api/library` | Add album to library |
| `PUT` | `/api/library/{id}` | Update rating/notes |
| `DELETE` | `/api/library/{id}` | Remove from library |

### Analytics (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics` | Get aggregated analytics |

### AI Insights (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/insights` | Generate AI music insights |

### Error Response Format
```json
{
    "timestamp": "2024-01-01T00:00:00",
    "status": 400,
    "error": "Bad Request",
    "message": "Descriptive error message",
    "fieldErrors": { "field": "Validation message" }
}
```

---

## 🧠 AI Feature

### SonicMind Music Intelligence Engine

**Approach**: Algorithmic analysis of user's library metadata (genres, artists, release dates, ratings) to generate personalized insights without requiring external AI API keys.

**How It Works**:

1. **Data Aggregation**: Queries all library items for the authenticated user
2. **Genre Analysis**: Computes genre distribution, diversity ratio, and dominance percentage
3. **Era Mapping**: Groups albums by decade, identifies preferred era with music history context
4. **Artist Profiling**: Identifies most-collected artists and concentration patterns
5. **Persona Classification**: Uses genre diversity ratio to classify into archetypes:
   - **>70% diversity** → "Eclectic Voyager"
   - **40-70% diversity** → "Balanced Connoisseur"
   - **<40% diversity** → "Genre Devotee"
6. **Mood Mapping**: Maps dominant genre to emotional signature (11 genre-mood mappings)
7. **Smart Recommendations**: Genre-specific album suggestions filtered against existing library
8. **Hidden Gem Detection**: Finds albums in under-represented genres and top-rated items

**Why This Approach?**
- No external API key required (self-contained)
- Instant response (no API latency)
- Deterministic and explainable results
- Scales with library size

---

## 🚀 Setup & Run Locally

### Prerequisites
- **Java 17+**
- **Maven 3.9+**
- **MySQL 8.0** (running on `localhost:3306`)
- **Node.js 18+** & **npm 9+**

### 1. Database Setup

```bash
# Start MySQL service (Windows - run as Administrator)
net start MySQL80

# Create database
mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS music_catalog_db;"
```

### 2. Backend

```bash
cd backend

# Build and run
mvn spring-boot:run

# The backend starts on http://localhost:8080
```

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# The frontend starts on http://localhost:5173
```

### 4. Run Tests

```bash
cd backend
mvn test
```

---

## 🏗 Architecture

```
Music Catalog Insights Platform
├── backend/                          # Spring Boot 3.4 application
│   ├── src/main/java/com/musicinsights/
│   │   ├── MusicInsightsApplication.java    # Entry point
│   │   ├── config/                          # Security, CORS, RestTemplate
│   │   ├── controller/                      # REST controllers
│   │   ├── dto/                             # Request/Response DTOs
│   │   ├── entity/                          # JPA entities
│   │   ├── exception/                       # Global error handling
│   │   ├── repository/                      # Spring Data JPA repos
│   │   ├── security/                        # JWT filter, UserDetails
│   │   └── service/                         # Business logic
│   └── src/test/java/                       # Unit tests
│
├── frontend/                         # React + Vite application
│   ├── src/
│   │   ├── api.js                           # API service layer
│   │   ├── App.jsx                          # Main app with routing
│   │   ├── index.css                        # Design system
│   │   ├── components/                      # Navbar, AuthModal
│   │   └── pages/                           # Search, Library, Analytics, AI
│   └── index.html                           # Entry HTML
│
└── README.md                         # This file
```

---

## ⚖️ Trade-offs & Design Decisions

| Decision | Rationale |
|----------|-----------|
| **MySQL over NoSQL** | Structured album data with relational user-library mapping. SQL aggregation powers real-time analytics without application-level computation. |
| **JWT over Session** | Stateless authentication simplifies horizontal scaling. Token stored in `localStorage` for SPA convenience. |
| **Algorithmic AI over LLM API** | No API key dependency, instant responses, deterministic outputs, and fully self-contained deployment. |
| **Spring Boot `@Cacheable`** | In-memory caching of iTunes search results reduces redundant external API calls. Trade-off: cache invalidation after 10 minutes. |
| **Vanilla CSS over Tailwind** | Complete control over the glassmorphism design system with CSS custom properties. Smaller bundle size. |
| **H2→MySQL switch** | Production-grade persistence vs in-memory. JPA abstraction makes this a config-only change. |
| **Albums over Songs/Artists** | Richest metadata per entity (dates, tracks, genres, prices, artwork) enabling the deepest analytics. |
| **Debounced search (300ms)** | Balances responsive UX with API rate limiting. Prevents flooding iTunes endpoint on every keystroke. |

---

## 📝 Good-to-Have Features Implemented

- ✅ **Unit Tests** (AuthService, LibraryService — JUnit 5 + Mockito)
- ✅ **Pagination** (Backend `Page<>` support with sort/direction params)
- ✅ **Debounced Search** (300ms frontend debounce)
- ✅ **Caching** (`@Cacheable` on iTunes proxy with TTL)
- ✅ **Validation** (Bean Validation + `@RestControllerAdvice`)
- ✅ **Loading & Empty States** (Spinners, contextual messages on all pages)
- ✅ **Responsive Design** (Mobile-first breakpoints)

---

## 📄 License

This project was built as a take-home assessment.
