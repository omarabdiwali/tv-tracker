import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import Users from '@/models/Users'
import { IUser } from "@/utils/types";
import dbConnect from "@/utils/dbConnect";
import Show from "@/models/Show";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "GET") return res.status(200).json({ success: false, message: 'Method not allowed.' });  
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(200).json({ success: false, message: 'Unauthenticated user.' });
  
  await dbConnect();
  const showFields = 'id image title imdbId releaseDate'
  let user: IUser | null = await Users.findOne({ email: session.user?.email });
  let savedShows = [];
  
  if (!user) {
    user = await Users.create({ email: session.user?.email, savedShows: [], savedMovies: [] });
  } else {
    const showIds = user.savedShows.map((show) => show.showId);
    savedShows = await Show.find({ id: { $in: showIds } }, showFields);
  }

  if (!user) return res.status(200).json({ success: false, message: 'Error creating user.' });
  return res.status(200).json({ success: true, shows: savedShows });
}