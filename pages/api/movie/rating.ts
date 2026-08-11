import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import { hasValue, IUser } from "@/utils/types";
import Users from "@/models/Users";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "POST") return res.status(200).json({ success: false, message: 'Method not allowed.' });

  const session = await getServerSession(req, res, authOptions);
  const { id, rating } = req.body;

  if (!session || !hasValue(id) || !hasValue(rating)) {
    return res.status(200).json({ success: false, message: 'Unauthenticated user.' });
  }

  await dbConnect();

  const user: IUser | null = await Users.findOne({ email: session.user?.email });
  if (!user) return res.status(200).json({ success: false, message: 'Unauthenticated user.' });
  
  const movieIndex = user.movies.findIndex((movie) => movie.movieId == `${id}`);
  const movieObj = movieIndex != -1 ? user.movies[movieIndex] : null;
  const isReset = rating == 0;
  
  if (movieIndex == -1 || (!movieObj?.watched && !isReset)) {
    return res.status(200).json({ success: false, message: 'Movie has not been watched.' });
  }

  user.movies[movieIndex].rating = rating;
  user.save();
  return res.status(200).json({ success: true });
}
