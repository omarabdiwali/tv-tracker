import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import Users from "@/models/Users";
import { EpisodeObjType, IUser, SessionType, UserShow } from "@/utils/types";
import Show from "@/models/Show";
import { hasValue } from "@/utils/util";

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
  const user: IUser | null = await Users.findById(session.user.id, 'shows');
  if (!user) return res.status(200).json({ success: false, message: "Unauthenticated user." });

  const index = user.shows.findIndex((show) => show.showId == `${showId}`);
  const showExists = await Show.exists({ id: showId });
  if (!showExists) return res.status(200).json({ success: false, message: "Invalid show." });
  
  if (index == -1) {
    const episodes = createEpisodeObj(episodeIds, btnTyp);
    const showObj: UserShow = { showId: `${showId}`, saved: false, episodes, rating: 0 };
    user.shows.push(showObj);
  } else {
    const episodes: EpisodeObjType = user.shows[index].episodes ?? {};
    if (value) {
      episodeIds.forEach((id: string | number) => episodes[id] = btnTyp);
    } else {
      episodeIds.forEach((id: string | number) => delete episodes[id]);
    }

    user.shows[index].episodes = episodes;
    user.markModified(`shows.${index}.episodes`);
  }

  await user.save();
  return res.status(200).json({ success: true });
}
