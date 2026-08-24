import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import Users from "@/models/Users";
import { ItemProps, IUser, StatusObjType } from "@/utils/types";
import { hasValue, buildPosterURL, purgeMoviesAndShows } from "@/utils/util";

const queryTMDB = async (statusInfo: StatusObjType) : Promise<ItemProps[]> => {
  const apiKey = process.env.TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}`;

  return fetch(url).then(res => res.json()).then(data => {
    const items = [];

    for (const movie of data.results) {
      const id = movie.id;
      const releaseDate = movie.release_date;
      const image = buildPosterURL(movie.poster_path, 'w185');
      const title = movie.title;

      const statusVal = `${id}` in statusInfo ? statusInfo[`${id}`] : -2;
      const saved = statusVal == 0 || statusVal == 1;
      const watched = statusVal == 0 || statusVal == -1;

      if (!hasValue(id) || !title || !image) continue;
      items.push({ id, title, image, releaseDate, saved, watched });
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
  let statusInfo: StatusObjType = {};
  
  if (!session) {
    return res.status(200).json({ success: false, message: 'Unauthenticated user.' });
  }

  await dbConnect();

  const user: IUser | null = await Users.findOne({ email: session.user?.email });
  if (!user) {
    await Users.create({ email: session.user?.email, movies: [], shows: [] })
  } else {
    await purgeMoviesAndShows(user);
    statusInfo = user.movies.reduce((acc: StatusObjType, movie) => {
      if (!movie.watched && !movie.saved) return acc;
      acc[movie.movieId] = -(Number(movie.watched || 0)) + Number(movie.saved || 0);
      return acc;
    }, {})
  }

  const movies = await queryTMDB(statusInfo);
  return res.status(200).json({ success: true, movies });
}
