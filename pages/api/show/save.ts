import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import Users from "@/models/Users";
import { hasValue, IUser } from "@/utils/types";
import Show from "@/models/Show";

const verifyRequiredKeys = (info: any) => {
  const { id, image, title } = info;
  return hasValue(id) && hasValue(image) && hasValue(title);
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

const queryTVMaze = async (showId: string, targetTitle: string) => {
  const url = `https://api.tvmaze.com/shows/${showId}?embed[]=nextepisode&embed[]=previousepisode`;

  return fetch(url).then(res => res.json()).then(async (data) => {
    const id = data.id;
    const title = data.name;
    const genres = data.genres;
    const homepage = data.officialSite;
    const imdbId = data.externals?.imdb;

    const language = data.language;
    const overview = data.summary;
    const releaseDate = data.premiered;

    const lastEpisode = parseEpisodeInfo(data._embedded?.previousepisode);
    const nextEpisode = parseEpisodeInfo(data._embedded?.nextepisode);
    const nextUpdatedAt = new Date();

    const voteAverage = data.rating?.average;
    const status = data.status;
    const image = data.image?.original || data.image?.medium || 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png';
    const imageSmall = data.image?.medium;

    if (!hasValue(id) || !title || title != targetTitle || !image) return {};
    return {
      id, title, image, imdbId, releaseDate, genres, lastEpisode, imageSmall,
      nextEpisode, homepage, language, overview, voteAverage, status, nextUpdatedAt
    };
  }).catch(err => {
    console.error(err);
    return {};
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "POST") return res.status(200).json({ success: false, message: 'Method not allowed.' });
  const { id, title, save } = req.body;
  const session = await getServerSession(req, res, authOptions);

  if (!session || !hasValue(id) || !title || !hasValue(save)) {
    const message = !session ? "Unauthenticated user." : "Missing body parameters.";
    return res.status(200).json({ success: false, message  });
  }

  await dbConnect();

  let user : IUser | null = await Users.findOne({ email: session.user?.email });
  let savedShows = new Set();

  if (!user) {
    user = await Users.create({ email: session.user?.email, savedShows: [], savedMovies: [] });
  } else {
    const mappedList = user.savedShows.map((show) => show.showId);
    savedShows = new Set(mappedList);
  }

  if (!user) return res.status(200).json({ success: false, message: "Unauthenticated user." });
  const show = await Show.exists({ id });

  if (!show) {
    const info = await queryTVMaze(id as string, title as string);
    if (Object.keys(info).length == 0) {
      return res.status(200).json({ success: false, message: "Invalid show." });
    } else if (verifyRequiredKeys(info)) {
      await Show.create(info);
    }
  }

  if (save && savedShows.has(`${id}`)) {
    return res.status(200).json({ success: true, message: `${title} has already been saved to watchlist.` });
  } else if (!save && !savedShows.has(`${id}`)) {
    return res.status(200).json({ success: true, message: `${title} has already been removed from watchlist.` });
  }

  if (save) {
    user.savedShows.push({ showId: `${id}`, watchedEpisodes: [] });
  } else {
    const index = user.savedShows.findIndex((show) => show.showId == `${id}`);
    user.savedShows.splice(index, 1);
  }

  user.save();
  return res.status(200).json({ success: true, message: `${title} has been ${save ? "saved to" : "removed from"} watchlist!` });
}
