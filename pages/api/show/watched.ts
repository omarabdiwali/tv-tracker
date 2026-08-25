import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import Users from "@/models/Users";
import { IUser, SessionType } from "@/utils/types";
import Show from "@/models/Show";
import { hasValue } from "@/utils/util";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "POST") return res.status(200).json({ success: false, message: 'Method not allowed.' });
  const { showId, epId, setWatched } = req.body;
  const session: SessionType = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.id || !hasValue(showId) || !hasValue(epId) || !hasValue(setWatched)) {
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
    const showObj = { showId: `${showId}`, saved: false, watchedEpisodes: setWatched ? [`${epId}`] : [], rating: 0 };
    user.shows.push(showObj);
  } else {
    const watchedEpisodesList = user.shows[index].watchedEpisodes;
    const watchedEpisodes = new Set(watchedEpisodesList);

    if (setWatched && watchedEpisodes.has(`${epId}`)) {
      return res.status(200).json({ success: true, message: "has already been watched." });
    } else if (!setWatched && !watchedEpisodes.has(`${epId}`)) {
      return res.status(200).json({ success: true, message: "has already not been watched." });
    }

    if (setWatched) {
      watchedEpisodes.add(`${epId}`);
    } else {
      watchedEpisodes.delete(`${epId}`);
    }

    user.shows[index].watchedEpisodes = [...watchedEpisodes];
  }

  await user.save();
  return res.status(200).json({ success: true, message: `has been set ${setWatched ? 'to' : 'to not'} watched!` });
}
