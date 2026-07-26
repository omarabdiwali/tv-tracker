import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import Users from "@/models/Users";
import { IUser } from "@/utils/types";
import dbConnect from "@/utils/dbConnect";

const buildPosterURL = (path: string, size: string) => {
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

const queryTMDB = async (movieId: string, saved: boolean, watched: boolean) => {
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
    const video = getBestVideo(data.videos.results);
    
    return {
      title, genres, video, runtime, homepage, imdbId, origin, image,
      overview, releaseDate, voteCount, voteAverage, saved, id, watched
    }
  }).catch(err => {
    console.error(err);
    return {};
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method != "GET") return res.status(200).json({ success: false, message: 'Method not allowed.' })
  if (!id) return res.status(200).json({ success: false, message: 'Missing parameter.' });

  const session = await getServerSession(req, res, authOptions);
  let saved: boolean = false;
  let watched: boolean = false;

  if (session) {
    await dbConnect();
    const user: IUser | null = await Users.findOne({ email: session.user?.email });
    if (!user) {
      await Users.create({ email: session.user?.email, savedMovies: [], savedShows: [] });
    } else {
      const index = user.savedMovies.findIndex((movie) => movie.movieId == `${id}`);
      saved = index != -1 ? true : false;
      watched = index != -1 ? user.savedMovies[index].watched : false;
    }
  }

  const info = await queryTMDB(id as string, saved, watched);
  return res.status(200).json({ success: true, movie: info });
}
