import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import Users from "@/models/Users";
import { SeasonData, SeasonEpisodeCountType, SessionType } from "@/utils/types";
import Show from "@/models/Show";
import { hasValue, correctRatingInfo, getIMDBRatings, timeToRefresh, getCorrectImdbId, DEFAULT_IMG } from "@/utils/util";
import UserShows from "@/models/UserShows";

const getEpisodeId = (href: string | undefined | null) => {
  if (!href) return null;
  const lastSlashIndex = href.lastIndexOf('/');
  if (lastSlashIndex == -1) return null;
  const id = href.slice(lastSlashIndex + 1);
  return id;
}

const countNumberOfEpisodes = (seasons: SeasonData): SeasonEpisodeCountType => {
  const seasonEpisodeCount: SeasonEpisodeCountType = { 'total': 0 };
  for (const [season, seasonInfo] of Object.entries(seasons)) {
    if (!(season in seasonEpisodeCount)) {
      seasonEpisodeCount[season] = 0;
    }

    seasonEpisodeCount[season] += seasonInfo.episodes.length;
    seasonEpisodeCount.total += seasonInfo.episodes.length;
  }

  return seasonEpisodeCount;
}

interface ParseEpisodes {
  seasons: SeasonData,
  nextEpisode: string | null,
  lastEpisode: string | null
}

const parseSeasons = (seasons: any, episodes: any, nextEpisodeId: string | null, lastEpisodeId: string | null): ParseEpisodes => {
  if (!episodes) return {
    seasons: {},
    nextEpisode: null,
    lastEpisode: null
  };

  let nextEpisode = null;
  let lastEpisode = null;

  const parsedSeasons: any = {};
  let seasonCount = 1;

  for (const season of seasons) {
    const seasonNumber: number = season.number ?? seasonCount;
    const name = season.name;
    parsedSeasons[seasonNumber] = name ? { name, episodes: [] } : { episodes: [] };
    seasonCount += 1;
  }
  
  for (const episode of episodes) {
    const id = episode.id;
    const title = episode.name || "Untitled";
    const season: number = episode.season;
    const number = episode.number;
    const airdate = episode.airdate;
    const summary = episode.summary;

    if (!hasValue(id) || !hasValue(number) || !hasValue(airdate) || !hasValue(season)) continue;

    if (nextEpisode == null && `${id}` == nextEpisodeId) {
      const episodeString = `${number}`.padStart(2, '0');
      nextEpisode = `${season}x${episodeString} / ${airdate}`;
    } else if (lastEpisode == null && `${id}` == lastEpisodeId) {
      const episodeString = `${number}`.padStart(2, '0');
      lastEpisode = `${season}x${episodeString} / ${airdate}`;
    }

    parsedSeasons[season].episodes.push({ id, title, number, airdate, summary });
  }

  return {
    seasons: parsedSeasons,
    nextEpisode,
    lastEpisode
  }
}

const verifyRequiredKeys = (info: any) => {
  const { id, image, title } = info;
  return hasValue(id) && hasValue(image) && hasValue(title);
}

const queryTVMaze = async (showId: string, prevImdbId: string | undefined) => {
  const url = `https://api.tvmaze.com/shows/${showId}?embed[]=episodes&embed[]=seasons`;

  return fetch(url).then(res => res.json()).then(async (data) => {
    if (!isNaN(parseInt(data.status))) return {};
    const id = data.id;
    const title = data.name;
    const genres = data.genres;
    const homepage = data.officialSite;
    const imdbId = getCorrectImdbId(prevImdbId, data.externals?.imdb)
    const imdbData = await getIMDBRatings(imdbId);
    const ratingInfo = correctRatingInfo(imdbData, data.rating?.average);

    const language = data.language;
    const overview = data.summary;
    const releaseDate = data.premiered;
    const voteAverage = ratingInfo.rating;
    const voteCount = ratingInfo.votes;
    const status = data.status;
    
    const lastEpisodeId = getEpisodeId(data._links?.previousepisode?.href);
    const nextEpisodeId = getEpisodeId(data._links?.nextepisode?.href);
    const { seasons, nextEpisode, lastEpisode } = parseSeasons(data._embedded.seasons, data._embedded.episodes, nextEpisodeId, lastEpisodeId);
    const seasonEpisodeCount = countNumberOfEpisodes(seasons);
    
    const episodeCount = seasonEpisodeCount.total;
    const image = data.image?.original || data.image?.medium || DEFAULT_IMG;
    const imageSmall = data.image?.medium;
    const nextUpdatedAt = new Date();

    return {
      title, genres, language, status, homepage, imdbId, image, overview, imageSmall, seasonEpisodeCount,
      releaseDate, voteAverage, voteCount, id, seasons, nextEpisode, lastEpisode, episodeCount, nextUpdatedAt
    }
  }).catch(err => {
    console.error(err);
    return {};
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const session: SessionType = await getServerSession(req, res, authOptions);
  
  if (req.method != "GET") return res.status(200).json({ success: false, message: 'Method not allowed.' })
  if (!id) return res.status(200).json({ success: false, message: 'Missing parameter.' });
  if (!session || !session.user?.id) return res.status(200).json({ success: false, message: 'Unauthenticated user.' });

  let showInfo = {};
  const showKeys = 'title genres language status homepage imdbId image overview releaseDate voteAverage voteCount id seasons episodeCount nextEpisode lastEpisode updatedAt';
  await dbConnect();
  const [user, show, userShow] = await Promise.all([
    Users.exists({ _id: session.user.id }),
    Show.findOne({ id }, showKeys).lean(),
    UserShows.findOne({ userId: session.user.id, showId: id }).lean()
  ])
  
  if (!user) return res.status(200).json({ success: false, message: 'Unauthenticated user.' });
  const saved = userShow ? !!userShow.saved : false;
  const actions = userShow ? userShow.episodes : {};
  const rating = userShow ? (userShow.rating || 0) : 0;
  const completed = userShow ? !!userShow.completed : false;
  const refreshTime = show ? show.status != 'Ended' ? 86400000 / 4 : 86400000 * 5 : 0;

  if (!show || !show.seasons || timeToRefresh(show.updatedAt, refreshTime)) {
    const info = await queryTVMaze(id as string, show?.imdbId);
    
    if (!verifyRequiredKeys(info)) {
      if (show) { showInfo = show; }
      else return res.status(200).json({ success: false, message: "Invalid show." });
    } else {
      !show ? await Show.create(info) : await Show.findOneAndUpdate({ id }, info);
      showInfo = info;
    }
  } else {
    showInfo = show;
  }

  return res.status(200).json({ success: true, show: showInfo, actions, saved, completed, rating });
}
