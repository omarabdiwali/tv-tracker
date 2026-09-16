import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import { SessionType } from "@/utils/types";
import Users from "@/models/Users";
import Show from "@/models/Show";
import { hasValue } from "@/utils/util";
import UserShows from "@/models/UserShows";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "POST") return res.status(200).json({ success: false, message: 'Method not allowed.' });
  const session: SessionType = await getServerSession(req, res, authOptions);
  const { id, completed } = req.body;

  if (!session || !session.user?.id || !hasValue(id) || !hasValue(completed)) {
    const message = (!session || !session.user?.id) ? 'Unauthenticated user.' : 'Missing body parameter(s).';
    return res.status(200).json({ success: false, message });
  }

  await dbConnect();
  const [user, showExists, show] = await Promise.all([
    Users.exists({ _id: session.user.id }),
    Show.exists({ id }),
    UserShows.findOne({ userId: session.user.id, showId: id })
  ])

  if (!user) return res.status(200).json({ success: false, message: 'Unauthenticated user.' });
  if (!showExists) return res.status(200).json({ success: false, message: 'Invalid show.' });  
  if (!show) {
    const showObj = { userId: session.user.id, showId: `${id}`, saved: false, completed, episodes: {}, rating: 0 };
    await UserShows.create(showObj);
  } else {
    show.completed = completed;
    await show.save();
  }

  return res.status(200).json({ success: true, message: 'shows completed status updated.' });
}
