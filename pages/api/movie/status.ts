import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import { SessionType } from "@/utils/types";
import Users from "@/models/Users";
import Movie from "@/models/Movie";
import { hasValue } from "@/utils/util";
import UserMovies from "@/models/UserMovies";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "POST") return res.status(200).json({ success: false, message: 'Method not allowed.' });

  const session: SessionType = await getServerSession(req, res, authOptions);
  const { id, status } = req.body;

  if (!session || !session.user?.id || !hasValue(id) || !hasValue(status)) {
    const message = (!session || !session.user?.id) ? 'Unauthenticated user.' : 'Missing body parameter(s).';
    return res.status(200).json({ success: false, message });
  }

  await dbConnect();
  const [user, movieExists, userMovie] = await Promise.all([
    Users.exists({ _id: session.user.id }),
    Movie.exists({ id }),
    UserMovies.findOne({ userId: session.user.id, movieId: id })
  ])

  if (!user) return res.status(200).json({ success: false, message: 'Unauthenticated user.' });
  if (!movieExists) return res.status(200).json({ success: false, message: 'Invalid movie.' });  
  if (!userMovie) {
    const movieObj = { userId: session.user.id, movieId: `${id}`, saved: false, watched: status, rating: 0 };
    await UserMovies.create(movieObj);
  } else {
    userMovie.watched = status;
    await userMovie.save();
  }

  return res.status(200).json({ success: true, message: 'Movie watched status updated.' });
}
