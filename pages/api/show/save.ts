import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import Users from "@/models/Users";
import { IUser } from "@/utils/types";
import Show from "@/models/Show";

const verifyRequiredKeys = (info: any) => {
  const { id, overview, image, title } = info;
  if (id == null || id == undefined) return false;
  if (overview == null || overview == undefined) return false;
  if (image == null || image == undefined) return false;
  if (title == null || title == undefined) return false;

  return true;
}

const fetchEpisodeInfo = async (href: string | undefined) => {
  if (!href) return null;
  return fetch(href).then(res => res.json()).then(data => {
    const season = data.season;
    const episode = data.number;
    const airdate = data.airdate;
    if (season == undefined || season == null || episode == undefined || episode == null || !airdate) return null;
    return `${season}x${episode} / ${airdate}`;
  })
}

const queryTVMaze = async (showId: string, targetTitle: string) => {
  const url = `https://api.tvmaze.com/shows/${showId}`;

  return fetch(url).then(res => res.json()).then(async (data) => {
    const id = data.id;
    const title = data.name;
    const genres = data.genres;
    const homepage = data.officialSite;
    const imdbId = data.externals?.imdb;

    const language = data.language;
    const overview = data.summary;
    const releaseDate = data.premiered;

    const lastEpisodeHref = data._links?.previousepisode?.href;
    const nextEpisodeHref = data._links?.nextepisode?.href;
    const lastEpisode = await fetchEpisodeInfo(lastEpisodeHref);
    const nextEpisode = await fetchEpisodeInfo(nextEpisodeHref);

    const voteAverage = data.rating?.average;
    const status = data.status;

    let image = data.image?.original;
    let imageSmall = data.image?.medium;
    if (!image) {
      image = data.image?.medium;
    }

    if (!id || !title || title != targetTitle || !image) return {};
    return {
      id, title, image, imdbId, releaseDate, genres, lastEpisode, imageSmall,
      nextEpisode, homepage, language, overview, voteAverage, status
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

  if (!session || id == null || id == undefined || !title || save == null || save == undefined) {
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
  const show = await Show.exists({ id: id });

  if (!show) {
    const info = await queryTVMaze(id as string, title as string);
    if (Object.keys(info).length == 0) {
      return res.status(200).json({ success: false, message: "Invalid show." });
    } else if (verifyRequiredKeys(info)) {
      await Show.create(info);
    }
  }

  if (save && savedShows.has(id)) {
    return res.status(200).json({ success: true, message: `${title} has already been saved to watchlist.` });
  } else if (!save && !savedShows.has(id)) {
    return res.status(200).json({ success: true, message: `${title} has already been removed from watchlist.` });
  }

  if (save) {
    user.savedShows.push({ showId: id, watchedEpisodes: [] });
  } else {
    const index = user.savedShows.findIndex((show) => show.showId == id);
    user.savedShows.splice(index, 1);
  }

  user.save();
  return res.status(200).json({ success: true, message: `${title} has been ${save ? "saved to" : "removed from"} watchlist!` });
}
