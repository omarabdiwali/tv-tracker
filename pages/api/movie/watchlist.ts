import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import Users from '@/models/Users'
import { IUser } from "@/utils/types";
import dbConnect from "@/utils/dbConnect";
import Movie from "@/models/Movie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "GET") return res.status(200).json({ success: false, message: 'Method not allowed.' });  
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(200).json({ success: false, message: 'Unauthenticated user.' });
  
  await dbConnect();
  const movieFields = 'id image title releaseDate'
  let user: IUser | null = await Users.findOne({ email: session.user?.email });
  let savedMovies = [];
  
  if (!user) {
    user = await Users.create({ email: session.user?.email, savedMovies: [], savedShows: [] });
  } else {
    const movieIds = user.savedMovies.map((movie) => movie.movieId);
    savedMovies = await Movie.find({ id: { $in: movieIds } }, movieFields);
  }

  if (!user) return res.status(200).json({ success: false, message: 'Error creating user.' });
  return res.status(200).json({ success: true, movies: savedMovies });
}