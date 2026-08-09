import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import Users from '@/models/Users'
import { hasValue, IShow, IUser, UserShow, ShowWatchlist } from "@/utils/types";
import dbConnect from "@/utils/dbConnect";
import Show from "@/models/Show";

type ObjType = {
  [id: string] : UserShow
}

const nextEpisodeInFuture = (nextEpisode: string) => {
  const dayOld = new Date();
  dayOld.setDate(dayOld.getDate() - 1);
  const dayOldTime = dayOld.getTime();
  
  const startIndex = nextEpisode.indexOf(' / ');
  const dateString = startIndex != -1 ? nextEpisode.slice(startIndex + 3) : null;
  if (!dateString) return false;
  return new Date(dateString as string).getTime() > dayOldTime;
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

const parseEpisodeInfo = (data: any) => {
  if (!data) return null;
  const season = data.season;
  const episode = data.number;
  const airdate = data.airdate;
  if (!hasValue(season) || !hasValue(episode) || !hasValue(airdate)) return null;

  const episodeString = `${episode}`.padStart(2, '0');
  return `${season}x${episodeString} / ${airdate}`
}

const getEpisodesAndImage = async (showId: string) => {
  const url = `https://api.tvmaze.com/shows/${showId}?embed[]=nextepisode&embed[]=previousepisode`;
  return fetch(url).then(res => res.json()).then(data => {
    if (data.status == 404) return {};
    const image = data.image?.original || data.image?.medium || 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png';
    const imageSmall = data.image?.medium;
    const lastEpisode = parseEpisodeInfo(data._embedded?.previousepisode);
    const nextEpisode = parseEpisodeInfo(data._embedded?.nextepisode);
    return { lastEpisode, nextEpisode, image, imageSmall };
  })
}

// Categories are as follows:
// 0 - Unwatched
// 1 - In Progress
// 2 - Completed / Up-to-Date

const addCategory = async (shows: IShow[], userShows: ObjType) => {
  const populated: ShowWatchlist[] = [];

  for (const show of shows) {
    let category = 0;
    const info = userShows[show.id];
    if (!info) continue;
    if (!info.saved && !info.completed) continue;

    if (checkIfPassed(show)) {
      const { lastEpisode, nextEpisode, image, imageSmall } = await getEpisodesAndImage(show.id);
      show.nextEpisode = nextEpisode || show.nextEpisode;
      show.lastEpisode = lastEpisode || show.lastEpisode;
      show.image = image || show.image;
      show.imageSmall = imageSmall || show.imageSmall;
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
      rating: info.rating,
      saved: info.saved,
      completed: info.completed,
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
  let userShows: IShow[] = [];
  let formatted: ShowWatchlist[] = [];

  if (!user) {
    user = await Users.create({ email: session.user?.email, shows: [], movies: [] });
  } else {
    const showIds = user.shows.map((show) => show.showId);
    const showObj: ObjType = user.shows.reduce((acc: ObjType, show) => {
      acc[show.showId] = show;
      return acc;
    }, {})

    userShows = await Show.find({ id: { $in: showIds } }, showFields);
    formatted = await addCategory(userShows, showObj);
  }

  if (!user) return res.status(200).json({ success: false, message: 'Error creating user.' });
  return res.status(200).json({ success: true, shows: formatted });
}