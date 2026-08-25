import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import { IUser, SessionType } from "@/utils/types";
import Users from "@/models/Users";
import Movie from "@/models/Movie";
import { hasValue } from "@/utils/util";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "POST") return res.status(200).json({ success: false, message: 'Method not allowed.' });

  const session: SessionType = await getServerSession(req, res, authOptions);
  const { id, status } = req.body;

  if (!session || !session.user?.id || !hasValue(id) || !hasValue(status)) {
    const message = (!session || !session.user?.id) ? 'Unauthenticated user.' : 'Missing body parameter(s).';
    return res.status(200).json({ success: false, message });
  }

  await dbConnect();

  const user: IUser | null = await Users.findById(session.user.id, 'movies');
  const movieExists = await Movie.exists({ id });
  if (!user) return res.status(200).json({ success: false, message: 'Unauthenticated user.' });
  if (!movieExists) return res.status(200).json({ success: false, message: 'Invalid movie.' });
  
  const movieIndex = user.movies.findIndex((movie) => movie.movieId == `${id}`);
  if (movieIndex == -1) {
    const movieObj = { movieId: `${id}`, saved: false, watched: status, rating: 0 };
    user.movies.push(movieObj);
  } else {
    user.movies[movieIndex].watched = status;
  }

  await user.save();
  return res.status(200).json({ success: true, message: 'Movie watched status updated.' });
}
