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
  
  const showIndex = user.shows.findIndex((show) => show.showId == `${id}`);
  if (showIndex == -1) {
    return res.status(200).json({ success: false, message: 'Show has not been saved/watched.' });
  }

  user.shows[showIndex].rating = rating;
  user.save();
  return res.status(200).json({ success: true });
}
