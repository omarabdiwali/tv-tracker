import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import Users from '@/models/Users'
import { IShow, IUser, SavedShow, ShowWatchlist } from "@/utils/types";
import dbConnect from "@/utils/dbConnect";
import Show from "@/models/Show";

type ObjType = {
  [id: string] : SavedShow
}

// Categories are as follows:
// 0 - Unwatched
// 1 - In Progress
// 2 - Completed / Up-to-Date

const addCategory = (shows: IShow[], savedShows: ObjType) => {
  const populated: ShowWatchlist[] = [];

  for (const show of shows) {
    let category = 0;
    const info = savedShows[show.id];
    if (!info) continue;

    if (info.watchedEpisodes.length == 0) {
      category = 0;
    } else {
      if (info.watchedEpisodes.length != show.episodeCount) {
        category = 1;
      } else {
        category = 2;
      }
    }

    populated.push({
      id: show.id,
      image: show.image,
      imageSmall: show.imageSmall,
      title: show.title,
      releaseDate: show.releaseDate,
      nextEpisode: show.nextEpisode,
      lastEpisode: show.lastEpisode,
      status: show.status,
      category
    });
  }

  return populated;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "GET") return res.status(200).json({ success: false, message: 'Method not allowed.' });  
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(200).json({ success: false, message: 'Unauthenticated user.' });
  
  await dbConnect();
  const showFields = 'id image imageSmall title episodeCount releaseDate nextEpisode lastEpisode status'
  let user: IUser | null = await Users.findOne({ email: session.user?.email });
  let savedShows: IShow[] = [];
  let formatted: ShowWatchlist[] = [];
  
  if (!user) {
    user = await Users.create({ email: session.user?.email, savedShows: [], savedMovies: [] });
  } else {
    const showIds = user.savedShows.map((show) => show.showId);
    const showObj: ObjType = user.savedShows.reduce((acc: ObjType, show) => {
      acc[show.showId] = show;
      return acc;
    }, {})
    
    savedShows = await Show.find({ id: { $in: showIds } }, showFields);
    formatted = addCategory(savedShows, showObj);
  }

  if (!user) return res.status(200).json({ success: false, message: 'Error creating user.' });
  return res.status(200).json({ success: true, shows: formatted });
}