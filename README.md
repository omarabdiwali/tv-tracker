# TV Tracker

A modern web application for tracking your favorite TV shows and movies. Save content to your personal watchlist and keep track of episodes you've watched.

### The project is hosted at: https://tracktvshows.vercel.app

## Features

- **Personal Watchlist**: Save and manage your favorite TV shows and movies
- **Episode Tracking**: Mark individual episodes as watched/unwatched with a collapsible season view
- **Search Functionality**: Search across both movies and TV shows
- **Trending Content**: Discover trending movies on the homepage
- **Google Authentication**: Secure sign-in with Google accounts
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js with Google provider
- **Notifications**: Notistack
- **Icons**: React Icons (IoIcons, BiIcons)
- **Backend API Routes**: Built-in Next.js API handlers

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- MongoDB database
- Google OAuth credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/omarabdiwali/tv-tracker.git
cd tv-tracker
```

2. Install dependencies:
```bash
npm install
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

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

### Authentication
- Click "Sign in with Google" to access your personal watchlist
- Upon authentication, you'll be redirected to the main application

### Browsing Content
- **Homepage**: View trending movies
- **Search**: Use the search bar in the header to find movies and TV shows

### Managing Your Watchlist
- **Movies & Shows Pages**: View all saved content
- Each item has a remove button (minus icon) to remove from your list

### Episode Tracking (TV Shows)
- Navigate to any TV show detail page
- Expand seasons to view episodes
- Click "Mark Watched" to track viewed episodes
- Watch count displays at each season header

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

This project is open-source and available under the MIT License.