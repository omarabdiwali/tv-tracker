import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import Users from "@/models/Users";
import { IUser, UpcomingMovie } from "@/utils/types";

const buildPosterURL = (path: string, size: string) => {
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

const queryTMDB = async (savedMovies: Set<string>) : Promise<UpcomingMovie[]> => {
  const apiKey = process.env.TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}`;

  return fetch(url).then(res => res.json()).then(data => {
    const items = [];

    for (const movie of data.results) {
      const id = movie.id;
      const releaseDate = movie.release_date;
      const image = movie.poster_path;
      const title = movie.title;
      const isSaved = savedMovies.has(`${id}`);

      let year = null;

      if (id == null || id == undefined || !title || !image) continue;
      if (releaseDate) {
        year = releaseDate.split("-", 1).at(0);
        if (isNaN(parseInt(year))) {
          year = null;
        }
      }

      items.push({ id, title, image: buildPosterURL(image, 'w185'), year, releaseDate, isSaved });
    }
    return items;
  }).catch(err => {
    console.error(err);
    return [];
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "GET") return res.status(200).json({ success: false, message: 'Method not allowed.' })

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

  const movies = await queryTMDB(savedMovies);
  return res.status(200).json({ success: true, movies });
}
