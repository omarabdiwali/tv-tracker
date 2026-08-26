import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import { IUser, SessionType, StatusObjType } from "@/utils/types";
import Users from "@/models/Users";
import { buildPosterURL, hasValue } from "@/utils/util";

const getYear = (str: string) => {
  return str.split('-', 1).at(0);
}

const queryTMDB = async (queryString: string, statusInfo: StatusObjType) => {
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

      const statusVal = `${id}` in statusInfo ? statusInfo[`${id}`] : -2;
      const saved = statusVal == 0 || statusVal == 1;
      const watched = statusVal == 0 || statusVal == -1;

      if (!hasValue(id) || !title || !image) continue;
      if (image == 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png') {
        if (!releaseDate || Number(getYear(releaseDate)) < 1970) continue;
        noImageItems.push({ id, title, image, releaseDate, saved, watched });
      } else {
        items.push({ id, title, image, releaseDate, saved, watched });
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
  const session: SessionType = await getServerSession(req, res, authOptions);

  if (req.method != "GET") return res.status(200).json({ success: false, message: 'Method not allowed.' })
  if (!q) return res.status(200).json({ success: false, message: 'Missing parameter.' });
  if (!session || !session.user?.id) return res.status(200).json({ success: false, message: 'Unauthenticated user.' });

  await dbConnect();
  const user: IUser | null = await Users.findById(session.user.id, 'movies');
  if (!user) return res.status(200).json({ success: false, message: 'Unauthenticated user.' });

  const statusInfo = user.movies.reduce((acc: StatusObjType, movie) => {
    if (!movie.watched && !movie.saved) return acc;
    acc[movie.movieId] = -(Number(movie.watched || 0)) + Number(movie.saved || 0);
    return acc;
  }, {})

  const movies = await queryTMDB(q as string, statusInfo);
  return res.status(200).json({ success: true, movies });
}
