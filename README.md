# TV Tracker

A modern web application for tracking TV shows and movies built with Next.js. Track what you're watching, discover new content, and manage your watchlist with episode-level progress tracking for TV shows.

### The project is hosted at: https://tracktvshows.vercel.app

![Show Details](https://i.imgur.com/QQv8xWh.png)

## Features

### TV Shows
- **Watchlist Management** - Add/remove shows from your personal watchlist
- **Episode Tracking** - Mark individual episodes as watched/unwatched
- **Season Progress** - Visual progress bars showing watched episodes per season
- **Bulk Actions** - Mark entire seasons as watched/unwatched with one click
- **Smart Sorting** - Sort by next episode air date or watch status (In Progress, Completed, Unwatched)
- **Episode Details** - View episode titles, air dates, and summaries

### Movies
- **Watchlist Management** - Save movies to watch later
- **Watch Status** - Mark movies as watched/unwatched
- **Sorting Options** - Sort by release date or watch status
- **Rich Details** - View ratings, runtime, genres, trailers, and IMDb links

### Discovery
- **Trending Movies** - Browse currently trending movies on the home page
- **Now Playing** - See movies currently in theaters with release dates
- **Search** - Search for both movies and TV shows simultaneously

### User Experience
- **Authentication** - Secure login via NextAuth
- **Real-time Notifications** - Toast notifications for all actions via Notistack
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Optimized Images** - Next.js Image component with proper sizing
- **Personal Ratings** - Ability to rate saved movies and shows out of 5 stars

![Search Page](https://i.imgur.com/ZWZbONh.png)

## Usage Guide

### Adding to Watchlist
1. Browse trending movies on the home page or search for content
2. Click the **+** button on any movie/show card
3. Item is added to your watchlist (requires authentication)

### Tracking TV Show Progress
1. Navigate to **Saved Shows** page
2. Click on a show to view details
3. Expand seasons to see episodes
4. Click **Mark Watched** on individual episodes or **Mark All Watched** for entire seasons
5. Progress bars update automatically

### Tracking Movies
1. Navigate to **Saved Movies** page
2. Click **Mark As Watched** on any movie card or detail page
3. Filter by **Watched/Unwatched** using the sort buttons

### Sorting & Filtering
- **Shows**: Sort by "Next Episode Date" or "Watch Status" (In Progress → Completed → Unwatched)
- **Movies**: Sort by "Release Date" or "Watch Status" (Unwatched → Watched)

![Sort Movies By Watch Status](https://i.imgur.com/VAckWKe.png)

## Color Legend

### Progress Bar
- **Red background (bg-red-600)**: Indicates a show with episodes (shows the container)
- **Green gradient (from-green-400 to-green-500)**: Represents watched episode progress
- **Blue marker (bg-blue-500)**: Shows the position of the next episode to watch

### Header Status
- **Green-800 (bg-green-800)**: Next episode is airing soon (active)
- **Orange-700 (bg-orange-700)**: Ongoing show without next episode yet (in progress / to be determined)
- **Red-800 (bg-red-800)**: Show has ended or no episodes available (completed/ended)

![Saved Shows](https://i.imgur.com/BwFsnTR.png)

These colors were chosen for visibility:
- Green gradients for positive/progress states
- Red for warnings/issues
- Orange for transitional states

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 13 (Pages Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Authentication** | NextAuth.js |
| **Notifications** | Notistack |
| **Icons** | React Icons (FontAwesome, Ionicons, Heroicons, Remix Icons) |
| **Sanitization** | isomorphic-dompurify |
| **API** | TMDB (The Movie Database), TVMaze |

## Project Structure

```
tv-tracker/
├── components/
│   ├── Header.tsx      # Movie detail page component
│   ├── MovieDetails.tsx      # Movie detail page component
│   └── ShowDetails.tsx       # TV show detail page with episode tracking
├── pages/
│   ├── index.tsx             # Home page - Trending movies
│   ├── movies.tsx            # Saved movies watchlist
│   ├── shows.tsx             # Saved shows watchlist with episode tracking
│   ├── search.tsx            # Search movies & TV shows
│   ├── playing.tsx           # Now playing/upcoming movies
│   ├── movie/[id].tsx        # Dynamic movie detail route
│   ├── show/[id].tsx         # Dynamic show detail route
│   └── api/                  # API routes (movie/show save, watchlist, search, etc.)
├── utils/
│   └── types.ts              # TypeScript interfaces
├── models/                   # Mongoose models
├── utils/                    # Utility functions
└── public/                   # Static assets
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- TMDB API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/omarabdiwali/tv-tracker.git
   cd tv-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
    Create a `.env.local` file in the root directory:
    ```
    MONGODB_URI=your_mongodb_connection_string
    NEXTAUTH_SECRET=your_nextauth_secret
    NEXTAUTH_URL=http://localhost:3000
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    TMDB_API_KEY=your_tmdb_api_key
    ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Authentication

The app uses **NextAuth.js** for authentication. Protected routes (`/movies`, `/shows`, `/playing`, `/search`) redirect unauthenticated users to the home page.

Supported providers (configure in `pages/api/auth/[...nextauth].ts`):
- Email/Password
- OAuth providers (Google, GitHub, etc.)