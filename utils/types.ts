import { Document, Types } from "mongoose";
import { Dispatch, SetStateAction } from "react";

export interface ItemProps {
  movie?: MovieWatchlist,
  id: string,
  title: string,
  image: string,
  saved?: boolean,
  releaseDate?: string,
  type?: string,
  showReleaseDate?: boolean,
  updateShows?: Dispatch<SetStateAction<number>>
}

export interface UserMovie {
  movieId: string;
  watched: boolean;
  saved?: boolean;
  rating?: number;
}

export interface UserShow {
  showId: string;
  watchedEpisodes: string[];
  saved?: boolean;
  rating?: number;
  completed?: boolean;
}

export type EpisodesData = {
  [season: number]: Episode[];
};

export interface Episode {
  id: string | number;
  title: string;
  number: number;
  airdate: string;
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
  voteAverage?: number;
  voteCount?: number;
  releaseDate?: string;
  origin?: string[];
  runtime?: string;
  homepage?: string;
  trailer?: string;
  saved?: boolean;
  watched?: boolean;
  rating?: number;
}

export interface ShowProps {
  id: string | number,
  title: string;
  image: string;
  overview: string;
  episodes?: EpisodesData;
  imdbId?: string;
  genres?: string[];
  voteAverage?: number;
  voteCount?: number,
  releaseDate?: string;
  homepage?: string;
  language?: string;
  status?: string;
  saved?: boolean;
  nextEpisode?: string | null;
  lastEpisode?: string | null;
  watched: Set<string>;
  episodeCount?: number;
  rating?: number;
  completed?: boolean;
}

export interface MovieDetailsProps {
  movie: MovieProps;
}

export interface ShowDetailsProps {
  show: ShowProps;
}

export interface IUser extends Document {
  email: string;
  movies: UserMovie[];
  shows: UserShow[];
  lastPurgedAt: Date;
}

export interface IMovie extends Document {
  _id: Types.ObjectId;
  id: string;
  image: string;
  imageSmall: string;
  title: string;
  imdbId: string;
  releaseDate: string;
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
  id: string;
  image: string;
  imageSmall: string;
  title: string;
  imdbId: string;
  releaseDate: string;
  overview: string;
  episodes: EpisodesData;
  genres: Array<string>;
  voteAverage: number;
  voteCount: number;
  homepage: string;
  language: string;
  status: string;
  nextEpisode: string | null;
  lastEpisode: string | null;
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
  nextEpisode: string | null,
  lastEpisode: string | null,
  status: string,
  category: number,
  episodeCount?: number,
  episodesWatched?: number,
  rating?: number,
  saved?: boolean,
  nextEpisodeNumber?: number,
  completed?: boolean
}

export interface MovieWatchlist {
  id: string,
  image: string,
  title: string,
  releaseDate: string,
  watched: boolean,
  rating?: number,
  saved?: boolean
}

export interface IMDBData {
  rating?: number;
  votes?: number;
}