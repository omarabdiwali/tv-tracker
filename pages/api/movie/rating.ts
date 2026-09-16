import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import { SessionType } from "@/utils/types";
import Users from "@/models/Users";
import { hasValue } from "@/utils/util";
import Movie from "@/models/Movie";
import UserMovies from "@/models/UserMovies";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "POST") return res.status(200).json({ success: false, message: 'Method not allowed.' });

  const session: SessionType = await getServerSession(req, res, authOptions);
  const { id, rating } = req.body;

  if (!session || !session.user?.id || !hasValue(id) || !hasValue(rating) || isNaN(parseFloat(`${rating}`))) {
    const message = (!session || !session.user?.id) ? 'Unauthenticated user.' : 'Missing body parameter(s).';
    return res.status(200).json({ success: false, message });
  }

  await dbConnect();
  const [user, movieExists, movie] = await Promise.all([
    Users.exists({ _id: session.user.id }),
    Movie.exists({ id }),
    UserMovies.findOne({ userId: session.user.id, movieId: id })
  ])

  if (!user) return res.status(200).json({ success: false, message: 'Unauthenticated user.' });
  if (!movieExists) return res.status(200).json({ success: false, message: 'Invalid movie.' });    
  if (!movie) {
    const movieObj = { userId: session.user.id, movieId: `${id}`, rating, watched: false };
    await UserMovies.create(movieObj);
  } else {
    movie.rating = rating;
    await movie.save();
  }

  return res.status(200).json({ success: true });
}
