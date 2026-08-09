import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import { hasValue, IUser } from "@/utils/types";
import Users from "@/models/Users";
import Show from "@/models/Show";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "POST") return res.status(200).json({ success: false, message: 'Method not allowed.' });

  const session = await getServerSession(req, res, authOptions);
  const { id, completed } = req.body;

  if (!session || !hasValue(id) || !hasValue(completed)) {
    return res.status(200).json({ success: false, message: 'Unauthenticated user.' });
  }

  await dbConnect();

  const user: IUser | null = await Users.findOne({ email: session.user?.email });
  const showExists = await Show.exists({ id });
  if (!user) return res.status(200).json({ success: false, message: 'Unauthenticated user.' });
  if (!showExists) return res.status(200).json({ success: false, message: 'Invalid show.' });
  
  const showIndex = user.shows.findIndex((shows) => shows.showId == `${id}`);
  if (showIndex == -1) {
    const showObj = { showId: `${id}`, saved: false, completed, watchedEpisodes: [], rating: 0 };
    user.shows.push(showObj);
  } else {
    user.shows[showIndex].completed = completed;
  }

  user.save();
  return res.status(200).json({ success: true, message: 'shows completed status updated.' });
}
