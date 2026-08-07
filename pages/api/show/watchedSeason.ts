import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import Users from "@/models/Users";
import { IUser } from "@/utils/types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "POST") return res.status(200).json({ success: false, message: 'Method not allowed.' });
  const { showId, episodeIds, watched } = req.body;
  const session = await getServerSession(req, res, authOptions);

  if (!session || !showId || !episodeIds || watched == undefined || watched == null) {
    const message = !session ? "Unauthenticated user." : "Missing body parameters.";
    return res.status(200).json({ success: false, message  });
  }

  await dbConnect();
  const user: IUser | null = await Users.findOne({ email: session.user?.email });
  if (!user) {
    return res.status(200).json({ success: false, message: "Unauthenticated user." });
  }

  const index = user.shows.findIndex((show) => show.showId == `${showId}`);
  
  if (index == -1) {
    const watchedEpisodes = episodeIds.map((id: string | number) => `${id}`);
    const showObj = { showId: `${showId}`, saved: false, watchedEpisodes: watched ? watchedEpisodes : [], rating: 0 };
    user.shows.push(showObj);
  } 
  else {
    const watchedEpisodesList = user.shows[index].watchedEpisodes;
    const watchedEpisodes = new Set(watchedEpisodesList);

    if (watched) {
      episodeIds.forEach((id: string | number) => watchedEpisodes.add(`${id}`));
    } else {
      episodeIds.forEach((id: string | number) => watchedEpisodes.delete(`${id}`));
    }

    user.shows[index].watchedEpisodes = [...watchedEpisodes];
  }

  user.save();
  return res.status(200).json({ success: true, message: `Success.` });
}
