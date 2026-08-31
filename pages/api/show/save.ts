import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import Users from "@/models/Users";
import { IUser, SessionType } from "@/utils/types";
import Show from "@/models/Show";
import { hasValue, verifyRequiredKeys, correctRatingInfo, getIMDBRatings } from "@/utils/util";

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
    if (!isNaN(parseInt(data.status))) return {};
    const id = data.id;
    const title = data.name;
    const genres = data.genres;
    const homepage = data.officialSite;
    const imdbId = data.externals?.imdb;
    const imdbData = await getIMDBRatings(imdbId);
    const ratingInfo = correctRatingInfo(imdbData, data.rating?.average);

    const language = data.language;
    const overview = data.summary;
    const releaseDate = data.premiered;

    const lastEpisode = parseEpisodeInfo(data._embedded?.previousepisode);
    const nextEpisode = parseEpisodeInfo(data._embedded?.nextepisode);
    const nextUpdatedAt = new Date();

    const voteAverage = ratingInfo.rating;
    const voteCount = ratingInfo.votes;
    const status = data.status;
    const image = data.image?.original || data.image?.medium || 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png';
    const imageSmall = data.image?.medium;

    if (!hasValue(id) || !title || title != targetTitle || !image) return {};
    return {
      id, title, image, imdbId, releaseDate, genres, lastEpisode, imageSmall, nextEpisode,
      homepage, language, overview, voteCount, voteAverage, status, nextUpdatedAt
    };
  }).catch(err => {
    console.error(err);
    return {};
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "POST") return res.status(200).json({ success: false, message: 'Method not allowed.' });
  const { id, title, save } = req.body;
  const session: SessionType = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.id || !hasValue(id) || !title || !hasValue(save)) {
    const message = (!session || !session.user?.id) ? "Unauthenticated user." : "Missing body parameter(s).";
    return res.status(200).json({ success: false, message });
  }

  await dbConnect();
  const user : IUser | null = await Users.findById(session.user.id, 'shows');
  if (!user) return res.status(200).json({ success: false, message: "Unauthenticated user." });
  const index = user.shows.findIndex(show => show.showId == `${id}`);
  const show = await Show.exists({ id });

  if (!show) {
    const info = await queryTVMaze(id as string, title as string);
    if (Object.keys(info).length == 0) {
      return res.status(200).json({ success: false, message: "Invalid show." });
    } else if (verifyRequiredKeys(info)) {
      await Show.create(info);
    }
  }

  if (index != -1) {
    const showObj = user.shows[index];
    if (save == showObj.saved) {
      return res.status(200).json({ success: true, message: `${title} has already been ${save ? 'saved to' : 'removed from'} watchlist.` });
    }
  }

  if (index != -1) {
    user.shows[index].saved = save;
  } else {
    const showObj = { showId: `${id}`, saved: save, watchedEpisodes: [], rating: 0 };
    user.shows.push(showObj);
  }

  await user.save();
  return res.status(200).json({ success: true, message: `${title} has been ${save ? "saved to" : "removed from"} watchlist!` });
}
