import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import Users from '@/models/Users'
import { IMovie, IUser, MovieWatchlist, SavedMovie } from "@/utils/types";
import dbConnect from "@/utils/dbConnect";
import Movie from "@/models/Movie";

type ObjType = {
  [id: string] : SavedMovie
}

const addWatchedStatus = (movies: IMovie[], savedMovies: ObjType) => {
  const populated: MovieWatchlist[] = [];

  for (const movie of movies) {
    const info = savedMovies[movie.id];
    if (!info) continue;
    populated.push({
      id: movie.id,
      title: movie.title,
      image: movie.imageSmall,
      releaseDate: movie.releaseDate,
      watched: info.watched
    })
  }

  return populated;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "GET") return res.status(200).json({ success: false, message: 'Method not allowed.' });
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(200).json({ success: false, message: 'Unauthenticated user.' });

  await dbConnect();
  const movieFields = 'id imageSmall title releaseDate'
  let user: IUser | null = await Users.findOne({ email: session.user?.email });
  let savedMovies: IMovie[] = [];
  let formatted: MovieWatchlist[] = [];

  if (!user) {
    user = await Users.create({ email: session.user?.email, savedMovies: [], savedShows: [] });
  } else {
    const movieIds = user.savedMovies.map((movie) => movie.movieId);
    const movieObj: ObjType = user.savedMovies.reduce((acc: ObjType, movie) => {
      acc[movie.movieId] = movie;
      return acc;
    }, {})

    savedMovies = await Movie.find({ id: { $in: movieIds } }, movieFields);
    formatted = addWatchedStatus(savedMovies, movieObj);
  }

  if (!user) return res.status(200).json({ success: false, message: 'Error creating user.' });
  return res.status(200).json({ success: true, movies: formatted });
}