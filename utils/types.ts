import { Document, Types } from "mongoose";

interface SavedMovie {
  movieId: string;
  watched: boolean;
}

interface SavedShow {
  showId: string;
  watchedEpisodes: string[];
}

export type EpisodesData = {
  [season: number]: Episode[];
};

export interface Episode {
  id: string | number;
  title: string;
  number: number;
  airdate: string;
  rating: number | null;
  summary: string;
  watched: boolean;
}

export interface MovieGenre {
  id: string | number;
  name: string;
}

export interface MovieProps {
  id: string | number,
  title: string;
  image: string;
  overview: string;
  imdbId?: string;
  genres?: MovieGenre[] | any;
  voteAverage?: string | number | undefined;
  voteCount?: string | number | undefined;
  releaseDate?: string;
  origin?: string[];
  runtime?: string;
  homepage?: string;
  video?: string;
  saved?: boolean;
}

export interface ShowProps {
  id: string | number,
  title: string;
  image: string;
  overview: string;
  episodes?: EpisodesData;
  imdbId?: string;
  genres?: string[];
  voteAverage?: string | number;
  releaseDate?: string;
  homepage?: string;
  language?: string;
  status?: string;
  saved?: boolean;
  nextEpisode?: string | null;
  lastEpisode?: string | null;
  watched: Set<string>;
}

export interface MovieDetailsProps {
  movie: MovieProps;
}

export interface ShowDetailsProps {
  show: ShowProps;
}

export interface IUser extends Document {
  email: string;
  savedMovies: SavedMovie[];
  savedShows: SavedShow[];
}

export interface IMovie extends Document {
  _id: Types.ObjectId;
  id: string;        // External ID (e.g., TMDB, TVMaze)
  image: string;     // Poster/backdrop URL
  title: string;     // Movie title
  imdbId: string;    // IMDb ID (e.g., "tt0111161")
  releaseDate: string; // Release date
}

export interface IShow extends Document {
  _id: Types.ObjectId;
  id: string;        // External ID (e.g., TMDB, TVMaze)
  image: string;     // Poster/backdrop URL
  title: string;     // Show title
  imdbId: string;    // IMDb ID (e.g., "tt0944947")
  releaseDate: string; // First air date
  overview: string;
  episodes: EpisodesData;
  genres: Array<string>;
  voteAverage: string;
  homepage: string;
  language: string;
  status: string;
  nextEpisode: string;
  lastEpisode: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface ScheduledShows {
  id: string,
  showId: string,
  title: string,
  image: string,
  year: string | undefined,
  isSaved: boolean | undefined,
  season: number | undefined,
  episode: number | undefined
}

export interface UpcomingMovie {
  id: string,
  releaseDate: string | undefined,
  image: string,
  title: string,
  isSaved: boolean,
  year?: string | null,
}