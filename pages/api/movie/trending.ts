import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import Users from '@/models/Users'
import { IUser, StatusObjType } from "@/utils/types";
import dbConnect from "@/utils/dbConnect";
import { buildPosterURL, hasValue, purgeMoviesAndShows } from "@/utils/util";

const queryTMDB = async (page: string, statusInfo: StatusObjType) => {
  const apiKey = process.env.TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}&page=${page}`

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
  const { page } = req.query;
  const session = await getServerSession(req, res, authOptions);

  if (req.method != "GET") return res.status(200).json({ success: false, message: 'Method not allowed.' });
  if (!page || (page != '1' && page != '2')) return res.status(200).json({ sucess: false, message: 'Invalid parameter.' });
  if (!session) return;

  await dbConnect();
  const user: IUser | null = await Users.findOne({ email: session.user?.email });
  let statusInfo: StatusObjType = {};
  
  if (!user) {
    await Users.create({ email: session.user?.email, movies: [], shows: [] });
  } else {
    page == '1' && await purgeMoviesAndShows(user);
    statusInfo = user.movies.reduce((acc: StatusObjType, movie) => {
      if (!movie.watched && !movie.saved) return acc;
      acc[movie.movieId] = -(Number(movie.watched || 0)) + Number(movie.saved || 0);
      return acc;
    }, {})
  }

  const movies = await queryTMDB(page as string, statusInfo);
  return res.status(200).json({ success: true, movies });
}