import { Document, Types } from "mongoose";

export interface SavedMovie {
  movieId: string;
  watched: boolean;
}

export interface SavedShow {
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
  trailer?: string;
  saved?: boolean;
  watched?: boolean;
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
  imageSmall: string;
  title: string;     // Movie title
  imdbId: string;    // IMDb ID (e.g., "tt0111161")
  releaseDate: string; // Release date
  genres: object[];
  trailer: string;
  origin: string[];
  runtime: string;
  overview: string;
  voteCount: number;
  voteAverage: number;
  homepage: string;
  updatedAt: Date;
  createdAt: Date;
}

export type SeasonEpisodeCountType = {
  [key: number | string]: number;
}

export interface IShow extends Document {
  _id: Types.ObjectId;
  id: string;        // External ID (e.g., TMDB, TVMaze)
  image: string;     // Poster/backdrop URL
  imageSmall: string;
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
  episodeCount?: number;
  seasonEpisodeCount?: SeasonEpisodeCountType;
  nextUpdatedAt?: Date;
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

export interface ShowWatchlist {
  id: string,
  image: string,
  imageSmall?: string,
  title: string,
  releaseDate: string,
  nextEpisode: string,
  lastEpisode: string,
  status: string,
  category: number,
  episodeCount?: number,
  episodesWatched?: number,
  seasonEpisodeCount?: SeasonEpisodeCountType
}

export interface MovieWatchlist {
  id: string,
  image: string,
  title: string,
  releaseDate: string,
  watched: boolean
}