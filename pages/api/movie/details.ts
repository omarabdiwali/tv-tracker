import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import Users from "@/models/Users";
import { IMovie, IUser } from "@/utils/types";
import dbConnect from "@/utils/dbConnect";
import Movie from "@/models/Movie";

const verifyRequiredKeys = (info: any) => {
  const { id, image, title } = info;
  if (id == null || id == undefined) return false;
  if (image == null || image == undefined) return false;
  if (title == null || title == undefined) return false;
  return true;
}

const buildPosterURL = (path: string, size: string) => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

const replaceValues = (video: any) => {
  return [ video.key, video.official, new Date(video.published_at), video.type ];
}

const getBestVideo = (videos: any) => {
  let currentBest = null;
  let isOfficial = false;
  let publishedAt = null;
  let videoType = "";

  for (const video of videos) {
    if (currentBest == null || publishedAt == null) {
      [currentBest, isOfficial, publishedAt, videoType] = replaceValues(video);
      continue;
    }
    else if (video.type == 'Trailer') {
      if (videoType != 'Trailer') {
        [currentBest, isOfficial, publishedAt, videoType] = replaceValues(video);
      } else if (video.official && !isOfficial) {
        [currentBest, isOfficial, publishedAt, videoType] = replaceValues(video);
      } else if (new Date(video.published_at) > publishedAt) {
        [currentBest, isOfficial, publishedAt, videoType] = replaceValues(video);
      }
    }
    else if (video.official) {
      if (videoType == 'Trailer') continue;
      if (!isOfficial) {
        [currentBest, isOfficial, publishedAt, videoType] = replaceValues(video);
      } else if (new Date(video.published_at) > publishedAt) {
        [currentBest, isOfficial, publishedAt, videoType] = replaceValues(video);
      }
    }
    else {
      if (new Date(video.published_at) > publishedAt) {
        [currentBest, isOfficial, publishedAt, videoType] = replaceValues(video);
      }
    }
  }

  if (!currentBest) return currentBest;
  return `https://www.youtube.com/watch?v=${currentBest}`;
}

const queryTMDB = async (movieId: string) => {
  const apiKey = process.env.TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=en-US&append_to_response=videos`;

  return fetch(url).then(res => res.json()).then(data => {
    const id = data.id;
    const title = data.title;
    const genres = data.genres;
    const homepage = data.homepage;
    const imdbId = data.imdb_id;
    const origin = data.origin_country;
    const overview = data.overview;
    const releaseDate = data.release_date;
    const voteCount = data.vote_count;
    const voteAverage = data.vote_average;
    const runtime = data.runtime ? `${data.runtime} mins` : data.runtime;
    const image = buildPosterURL(data.poster_path, 'w342');
    const imageSmall = buildPosterURL(data.poster_path, 'w185');
    const trailer = getBestVideo(data.videos.results);

    return {
      title, genres, trailer, runtime, homepage, imdbId, origin, image,
      imageSmall, overview, releaseDate, voteCount, voteAverage, id
    }
  }).catch(err => {
    console.error(err);
    return {};
  })
}

const formatData = (movie: any, saved: boolean, watched: boolean) => {
  return {
    title: movie.title, genres: movie.genres, trailer: movie.trailer, runtime: movie.runtime, homepage: movie.homepage,
    imdbId: movie.imdbId, origin: movie.origin, image: movie.image, overview: movie.overview, releaseDate: movie.releaseDate,
    voteCount: movie.voteCount, voteAverage: movie.voteAverage, id: movie.id, saved, watched
  }
}

const timeToRefresh = (from: Date): boolean => {
  const refreshTime = 86400000 * 15;
  const current = new Date().getTime();
  const fromMs = new Date(from).getTime();
  return (current - fromMs) >= refreshTime;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method != "GET") return res.status(200).json({ success: false, message: 'Method not allowed.' })
  if (!id) return res.status(200).json({ success: false, message: 'Missing parameter.' });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(200).json({ success: false, message: 'Unauthenticated user.' });
  let saved: boolean = false;
  let watched: boolean = false;

  await dbConnect();
  const user: IUser | null = await Users.findOne({ email: session.user?.email });
  if (!user) {
    await Users.create({ email: session.user?.email, savedMovies: [], savedShows: [] });
  } else {
    const index = user.savedMovies.findIndex((movie) => movie.movieId == `${id}`);
    saved = index != -1 ? true : false;
    watched = index != -1 ? user.savedMovies[index].watched : false;
  }

  let info: any = {};
  const fields = 'title genres trailer updatedAt runtime homepage imdbId origin image overview releaseDate voteCount voteAverage id';
  const movie: IMovie | null = await Movie.findOne({ id }, fields);

  if (!movie || movie.trailer == 'n/a' || timeToRefresh(movie.updatedAt)) {
    const data = await queryTMDB(id as string);
    verifyRequiredKeys(data) && (!movie ? await Movie.create(data) : await Movie.findOneAndUpdate({ id }, data));
    info = formatData(data, saved, watched);
  } else {
    info = formatData(movie, saved, watched);
  }

  return res.status(200).json({ success: true, movie: info });
}
