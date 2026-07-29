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

const nextEpisodeInFuture = (nextEpisode: string) => {
  const currentTime = new Date().getTime();
  const startIndex = nextEpisode.indexOf(' / ');
  const dateString = startIndex != -1 ? nextEpisode.slice(startIndex + 3) : null;
  if (!dateString) return false;
  return new Date(dateString as string).getTime() > currentTime;
}

const checkIfPassed = (show: IShow) => {
  const nextEpisode = show.nextEpisode;
  const status = show.status;
  const refresh = 86400000 / 4;
  const currentTime = new Date().getTime();
  const updatedAt = show.nextUpdatedAt;

  if (!status || status == 'Ended') return false;
  if (nextEpisode && nextEpisodeInFuture(nextEpisode)) return false;
  if (!updatedAt) return true;

  return (currentTime - new Date(updatedAt).getTime()) >= refresh;
}

const getNextEpisode = async (showId: string) => {
  const url = `https://api.tvmaze.com/shows/${showId}?embed=nextepisode`;
  return fetch(url).then(res => res.json()).then(info => {
    if (!info._embedded || !info._embedded.nextepisode) return null;
    const data = info._embedded.nextepisode;
    const season = data.season;
    const episode = data.number;
    const airdate = data.airdate;
    if (season == undefined || season == null || episode == undefined || episode == null || !airdate) return null;
    const episodeString = `${episode}`.padStart(2, '0');
    return `${season}x${episodeString} / ${airdate}`;
  })
}

// Categories are as follows:
// 0 - Unwatched
// 1 - In Progress
// 2 - Completed / Up-to-Date

const addCategory = async (shows: IShow[], savedShows: ObjType) => {
  const populated: ShowWatchlist[] = [];

  for (const show of shows) {
    let category = 0;
    const info = savedShows[show.id];
    if (!info) continue;

    if (checkIfPassed(show)) {
      const nextEpisode = await getNextEpisode(show.id);
      show.nextEpisode = nextEpisode ? nextEpisode : show.nextEpisode;
      show.nextUpdatedAt = new Date();
      await show.save({ timestamps: false });
    }

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
      episodeCount: show.episodeCount,
      episodesWatched: info.watchedEpisodes.length,
      seasonEpisodeCount: show.seasonEpisodeCount,
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
  const showFields = 'id image imageSmall title episodeCount releaseDate nextEpisode lastEpisode nextUpdatedAt status seasonEpisodeCount'
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
    formatted = await addCategory(savedShows, showObj);
  }

  if (!user) return res.status(200).json({ success: false, message: 'Error creating user.' });
  return res.status(200).json({ success: true, shows: formatted });
}