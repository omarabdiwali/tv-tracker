import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import Users from "@/models/Users";
import { EpisodeObjType, SessionType, UserShow } from "@/utils/types";
import Show from "@/models/Show";
import { hasValue } from "@/utils/util";
import UserShows from "@/models/UserShows";

const createEpisodeObj = (episodeIds: (string | number)[], value: 1 | 2) : EpisodeObjType => {
  const item: EpisodeObjType = {};
  for (const id of episodeIds) {
    item[id] = value;
  }

  return item;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "POST") return res.status(200).json({ success: false, message: 'Method not allowed.' });
  const { showId, episodeIds, value, btnTyp } = req.body;
  const session: SessionType = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.id || !hasValue(showId) || !hasValue(episodeIds) || episodeIds.length == 0 
    || !hasValue(value) || !hasValue(btnTyp) || (btnTyp != 1 && btnTyp != 2)) {
    const message = (!session || !session.user?.id) ? "Unauthenticated user." : "Missing body parameter(s).";
    return res.status(200).json({ success: false, message });
  }

  await dbConnect();
  const [user, showExists, show] = await Promise.all([
    Users.exists({ _id: session.user.id }),
    Show.exists({ id: showId }),
    UserShows.findOne({ userId: session.user.id, showId })
  ])

  if (!user) return res.status(200).json({ success: false, message: "Unauthenticated user." });
  if (!showExists) return res.status(200).json({ success: false, message: "Invalid show." });
  
  if (!show) {
    const episodes = createEpisodeObj(episodeIds, btnTyp);
    const showObj = { userId: session.user.id, showId: `${showId}`, saved: false, episodes, rating: 0 };
    await UserShows.create(showObj);
    return res.status(200).json({ success: true });
  }
  
  const episodes: EpisodeObjType = show.episodes ?? {};
  if (value) {
    episodeIds.forEach((id: string | number) => episodes[id] = btnTyp);
  } else {
    episodeIds.forEach((id: string | number) => delete episodes[id]);
  }
  
  show.episodes = episodes;
  show.markModified('episodes');
  await show.save();
  return res.status(200).json({ success: true });
}
