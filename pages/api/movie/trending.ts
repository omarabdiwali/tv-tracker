import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import Users from '@/models/Users'
import { hasValue, IUser } from "@/utils/types";
import dbConnect from "@/utils/dbConnect";

const buildPosterURL = (path: string, size: string) => {
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

const queryTMDB = async (page: string, savedMovies: Set<string>) => {
  const apiKey = process.env.TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}&page=${page}`

  return fetch(url).then(res => res.json()).then(data => {
    const items = [];

    for (const movie of data.results) {
      const id = movie.id;
      const releaseDate = movie.release_date;
      const image = buildPosterURL(movie.poster_path, 'w185');
      const title = movie.title;
      const saved = savedMovies.has(`${id}`);

      if (!hasValue(id) || !title || !image) continue;
      items.push({ id, title, image, releaseDate, saved });
    }
    return items;
  }).catch(err => {
    console.error(err);
    return [];
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { page } = req.query;
  if (req.method != "GET") return res.status(200).json({ success: false, message: 'Method not allowed.' });
  if (!page || (page != '1' && page != '2')) return res.status(200).json({ sucess: false, message: 'Invalid parameter.' });

  const session = await getServerSession(req, res, authOptions);
  let savedMovies: Set<string> = new Set();

  if (session) {
    await dbConnect();
    const user: IUser | null = await Users.findOne({ email: session.user?.email });
    if (!user) {
      await Users.create({ email: session.user?.email, movies: [], shows: [] });
    } else {
      const info = user.movies.filter((movie) => movie.saved).map((movie) => movie.movieId);
      savedMovies = new Set(info);
    }
  }

  const movies = await queryTMDB(page as string, savedMovies);
  return res.status(200).json({ success: true, movies });
}