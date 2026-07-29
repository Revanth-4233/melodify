# 🎵 Melodify - Music Catalog Insights Platform

Melodify is a premium, full-stack web application designed to let users explore a massive public music catalog, curate a personal music library, view analytics on their listening habits, and receive personalized, AI-driven insights into their music taste.

This project was built as an end-to-end take-home assignment to demonstrate modern full-stack development, secure API design, and third-party API integrations (iTunes & AI).

## ✨ Features

- **Public Catalog Search**: Search the global iTunes database for artists, albums, and songs. 
- **Global Audio Player**: Listen to 30-second official audio previews seamlessly via a persistent global player sidebar.
- **Personal Library**: Authenticated users can save songs to their personal library, rate them, and add personal notes.
- **Advanced Analytics**: Visualizes the user's library statistics (top genres, decades, artist distribution) using beautiful interactive charts.
- **AI-Driven Insights**: Integrates with the Google Gemini AI to analyze the user's saved library and generate personalized recommendations and music taste profiling.
- **Secure Authentication**: Stateless, secure authentication using JSON Web Tokens (JWT).
- **Premium Aesthetics**: A highly polished UI featuring a "Deep Space" dark theme, glassmorphism, responsive design, and fluid micro-animations.

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js (App Router) & React.js
- **Styling**: Vanilla CSS (Global variables, CSS Modules, Flexbox/Grid)
- **Data Visualization**: Recharts
- **Icons/Fonts**: Google Fonts (Inter)

### Backend
- **Framework**: Java 17 & Spring Boot 3
- **Security**: Spring Security & JWT Token Authentication
- **Data Access**: Spring Data JPA & Hibernate
- **AI Integration**: Google Gemini API via REST
- **External API**: iTunes Search API

### Database
- **Primary Database**: MySQL (Configured for local hosting)

---

## 🚀 Local Setup & Installation

### Prerequisites
- **Java 17+** and **Maven** installed
- **Node.js 18+** and **npm** installed
- **MySQL Server** installed and running on default port (3306)

### 1. Database Setup
Log into your local MySQL instance and create a fresh database for the application:
```sql
CREATE DATABASE melodify;
```

### 2. Backend Setup
Navigate to the backend directory and configure your environment:
```bash
cd backend
```

Open `src/main/resources/application.yml` and ensure your database credentials and API keys are correct:
- Update the MySQL `username` and `password` if yours differ from `root`/`root`.
- Insert your Google Gemini API key into `app.gemini.api-key`.

Start the Spring Boot server:
```bash
mvn clean compile spring-boot:run
```
*Note: Hibernate will automatically generate all necessary database tables upon startup.*

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and install the dependencies:
```bash
cd frontend
npm install
```

Start the Next.js development server:
```bash
npm run dev
```

### 4. Access the Application
Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**. 
Create a new account, login, and start building your library!

---

## 🏛️ Application Architecture

- **Stateless API**: The Spring Boot backend exposes a purely stateless RESTful API. Client sessions are managed entirely via JWTs stored in the browser.
- **Responsive Component Design**: The Next.js frontend employs a strict component-based architecture with global React Context (`AuthProvider`, `PlayerProvider`, `ToastProvider`) managing complex application state.
- **Proxy/CORS Management**: The Spring Boot server is configured to accept Cross-Origin requests specifically from the frontend's local development port, ensuring secure client-server communication.

## 📝 License
This project is created for educational/demonstration purposes as part of a technical assignment.
