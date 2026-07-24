import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import { IUser } from "@/utils/types";
import Users from "@/models/Users";

const buildPosterURL = (path: string, size: string) => {
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

const queryTMDB = async (queryString: string, savedMovies: Set<string>) => {
  const apiKey = process.env.TMDB_API_KEY;
  const query = encodeURIComponent(queryString);
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}&include_adult=false&language=en-US&page=1`;

  return fetch(url).then(res => res.json()).then(data => {
    const items = [];

    for (const movie of data.results) {
      const id = movie.id;
      const release = movie.release_date;
      const image = movie.poster_path;
      const name = movie.title;
      const isSaved = savedMovies.has(`${id}`);
      
      let year = null;

      if (id == null || id == undefined || !name || !image) continue;
      if (release) {
        year = release.split("-", 1).at(0);
        if (isNaN(parseInt(year))) {
          year = null;
        }
      }

      items.push({ id, name, image: buildPosterURL(image, 'w185'), year, isSaved });
    }
    return items;
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
    await Users.create({ email: session.user?.email, savedMovies: [], savedShows: [] })
  } else {
    const info = user.savedMovies.map((movie) => movie.movieId);
    savedMovies = new Set(info);
  }

  const movies = await queryTMDB(q as string, savedMovies);
  return res.status(200).json({ success: true, movies });
}
