import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import Users from "@/models/Users";
import { IUser } from "@/utils/types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "POST") return res.status(200).json({ success: false, message: 'Method not allowed.' });
  const { showId, epId, setWatched } = req.body;
  const session = await getServerSession(req, res, authOptions);

  if (!session || !showId || !epId || setWatched == null || setWatched == undefined) {
    const message = !session ? "Unauthenticated user." : "Missing body parameters.";
    return res.status(200).json({ success: false, message  });
  }

  await dbConnect();
  const user: IUser | null = await Users.findOne({ email: session.user?.email });
  if (!user) {
    return res.status(200).json({ success: false, message: "Invalid user." });
  }

  const index = user.savedShows.findIndex((show) => show.showId == `${showId}`);
  if (index == -1) {
    return res.status(200).json({ success: false, message: "Show has to be on watchlist." });
  }

  const watchedEpisodesList = user.savedShows[index].watchedEpisodes;
  const watchedEpisodes = new Set(watchedEpisodesList);
  
  if (setWatched && watchedEpisodes.has(`${epId}`)) {
    return res.status(200).json({ success: true, message: "Episode has already been watched." });
  } else if (!setWatched && !watchedEpisodes.has(`${epId}`)) {
    return res.status(200).json({ success: true, message: "Episode has already not been watched." });
  }

  if (setWatched) {
    watchedEpisodesList.push(`${epId}`);
  } else {
    const epIndex = watchedEpisodesList.findIndex((ep) => ep == `${epId}`);
    if (epIndex == -1) {
      return res.status(200).json({ success: true, message: "Episode has already not been watched." });
    }
    watchedEpisodesList.splice(epIndex, 1);
  }

  user.savedShows[index].watchedEpisodes = [...watchedEpisodesList];
  user.save();
  return res.status(200).json({ success: true, message: `Episode has been set to${setWatched ? '' : ' not'} watched!` });
}
