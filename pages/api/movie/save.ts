import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import Users from "@/models/Users";
import { hasValue, IUser } from "@/utils/types";
import Movie from "@/models/Movie";

const buildPosterURL = (path: string, size: string) => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

const verifyRequiredKeys = (info: any) => {
  const { id, image, title } = info;
  return hasValue(id) && hasValue(image) && hasValue(title);
}

const queryTMDB = async (movieId: string, targetTitle: string) => {
  const apiKey = process.env.TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=en-US`;

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
    const trailer = "n/a";

    if (title && title != targetTitle) return {};

    return {
      title, genres, trailer, runtime, homepage, imdbId, origin, image,
      imageSmall, overview, releaseDate, voteCount, voteAverage, id
    }
  }).catch(err => {
    console.error(err);
    return {};
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "POST") return res.status(200).json({ success: false, message: 'Method not allowed.' });
  const { id, title, save } = req.body;
  const session = await getServerSession(req, res, authOptions);

  if (!session || !hasValue(id) || !title || !hasValue(save)) {
    const message = !session ? "Unauthenticated user." : "Missing body parameters.";
    return res.status(200).json({ success: false, message  });
  }

  await dbConnect();

  let user : IUser | null = await Users.findOne({ email: session.user?.email });
  let savedMovies = new Set();

  if (!user) {
    user = await Users.create({ email: session.user?.email, savedMovies: [], savedShows: [] });
  } else {
    const mappedList = user.savedMovies.map((movie) => movie.movieId);
    savedMovies = new Set(mappedList);
  }

  if (!user) return res.status(200).json({ success: false, message: "Error creating user." });
  const movie = await Movie.exists({ id });

  if (!movie) {
    const info = await queryTMDB(id as string, title as string);
    if (!verifyRequiredKeys(info)) {
      return res.status(200).json({ success: false, message: "Invalid movie." });
    }
    await Movie.create(info);
  }

  if (save && savedMovies.has(`${id}`)) {
    return res.status(200).json({ success: true, message: `${title} has already been saved to watchlist.` });
  } else if (!save && !savedMovies.has(`${id}`)) {
    return res.status(200).json({ success: true, message: `${title} has already been removed from watchlist.` });
  }

  if (save) {
    user.savedMovies.push({ movieId: `${id}`, watched: false });
  } else {
    const index = user.savedMovies.findIndex((movie) => movie.movieId == `${id}`);
    user.savedMovies.splice(index, 1);
  }

  user.save();
  return res.status(200).json({ success: true, message: `${title} has been ${save ? "saved to" : "removed from"} watchlist!` });
}
