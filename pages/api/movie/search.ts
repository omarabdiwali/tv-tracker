import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import { hasValue, IUser } from "@/utils/types";
import Users from "@/models/Users";

const buildPosterURL = (path: string, size: string) => {
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

const getYear = (str: string) => {
  return str.split('-', 1).at(0);
}

const queryTMDB = async (queryString: string, savedMovies: Set<string>) => {
  const apiKey = process.env.TMDB_API_KEY;
  const query = encodeURIComponent(queryString);
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}&include_adult=false&language=en-US&page=1`;

  return fetch(url).then(res => res.json()).then(data => {
    const items = [];
    const noImageItems = [];

    for (const movie of data.results) {
      const id = movie.id;
      const releaseDate = movie.release_date;
      const image = movie.poster_path ? buildPosterURL(movie.poster_path, 'w185') : 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png';
      const title = movie.title;
      const saved = savedMovies.has(`${id}`);

      if (!hasValue(id) || !title || !image) continue;
      if (image == 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png') {
        if (!releaseDate || Number(getYear(releaseDate)) < 1970) continue;
        noImageItems.push({ id, title, image, releaseDate, saved });
      } else {
        items.push({ id, title, image, releaseDate, saved });
      }
    }
    return items.concat(noImageItems);
  }).catch(err => {
    console.error(err);
    return [];
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q } = req.query;
  if (req.method != "GET") return res.status(200).json({ success: false, message: 'Method not allowed.' })
  if (!q) return res.status(200).json({ success: false, message: 'Missing parameter.' });

  const session = await getServerSession(req, res, authOptions);
  let savedMovies: Set<string> = new Set();
  if (!session) {
    return res.status(200).json({ success: false, message: 'Unauthenticated user.' });
  }

  await dbConnect();

  const user: IUser | null = await Users.findOne({ email: session.user?.email });
  if (!user) {
    await Users.create({ email: session.user?.email, movies: [], shows: [] })
  } else {
    const info = user.movies.filter((movie) => movie.saved).map((movie) => movie.movieId);
    savedMovies = new Set(info);
  }

  const movies = await queryTMDB(q as string, savedMovies);
  return res.status(200).json({ success: true, movies });
}
