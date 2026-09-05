import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import Users from "@/models/Users";
import { IUser, EpisodesData, IShow, SeasonEpisodeCountType, SessionType } from "@/utils/types";
import Show from "@/models/Show";
import { hasValue, correctRatingInfo, getIMDBRatings, timeToRefresh, getCorrectImdbId } from "@/utils/util";

const getEpisodeId = (href: string | undefined | null) => {
  if (!href) return null;
  const lastSlashIndex = href.lastIndexOf('/');
  if (lastSlashIndex == -1) return null;
  const id = href.slice(lastSlashIndex + 1);
  return id;
}

const countNumberOfEpisodes = (seasons: EpisodesData): SeasonEpisodeCountType => {
  const seasonEpisodeCount: SeasonEpisodeCountType = { 'total': 0 };
  for (const [season, episodes] of Object.entries(seasons)) {
    const seasonInt = Number(season);
    if (isNaN(seasonInt)) continue;
    if (!(seasonInt in seasonEpisodeCount)) {
      seasonEpisodeCount[seasonInt] = 0;
    }

    seasonEpisodeCount[seasonInt] += episodes.length;
    seasonEpisodeCount.total += episodes.length;
  }

  return seasonEpisodeCount;
}

interface ParseEpisodes {
  episodes: EpisodesData,
  nextEpisode: string | null,
  lastEpisode: string | null
}

const parseEpisodes = (episodes: any, nextEpisodeId: string | null, lastEpisodeId: string | null): ParseEpisodes => {
  if (!episodes) return {
    episodes: {},
    nextEpisode: null,
    lastEpisode: null
  };

  let nextEpisode = null;
  let lastEpisode = null;

  const seasons: any = {};
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

    (seasons[season] ??= []).push({ id, title, number, airdate, summary });
  }

  return {
    episodes: seasons,
    nextEpisode,
    lastEpisode
  }
}

const verifyRequiredKeys = (info: any) => {
  const { id, image, title } = info;
  return hasValue(id) && hasValue(image) && hasValue(title);
}

const queryTVMaze = async (showId: string, prevImdbId: string | undefined) => {
  const url = `https://api.tvmaze.com/shows/${showId}?embed=episodes`;

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
    const { episodes, nextEpisode, lastEpisode } = parseEpisodes(data._embedded.episodes, nextEpisodeId, lastEpisodeId);
    const seasonEpisodeCount = countNumberOfEpisodes(episodes);
    
    const episodeCount = seasonEpisodeCount.total;
    const image = data.image?.original || data.image?.medium || 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png';
    const imageSmall = data.image?.medium;
    const nextUpdatedAt = new Date();

    return {
      title, genres, language, status, homepage, imdbId, image, overview, imageSmall, seasonEpisodeCount,
      releaseDate, voteAverage, voteCount, id, episodes, nextEpisode, lastEpisode, episodeCount, nextUpdatedAt
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
  const showKeys = 'title genres language status homepage imdbId image overview releaseDate voteAverage voteCount id episodes episodeCount nextEpisode lastEpisode updatedAt';
  await dbConnect();
  const user: IUser | null = await Users.findById(session.user.id, 'shows').lean();
  if (!user) return res.status(200).json({ success: false, message: 'Unauthenticated user.' });

  const index = user.shows.findIndex((show) => show.showId == `${id}`);
  const saved = index != -1 ? !!user.shows[index].saved : false;
  const watched = index != -1 ? user.shows[index].watchedEpisodes : [];
  const rating = index != -1 ? (user.shows[index].rating || 0) : 0;
  const completed = index != -1 ? !!user.shows[index].completed : false;
  const show: IShow | null = await Show.findOne({ id }, showKeys);
  const refreshTime = show ? show.status != 'Ended' ? 86400000 / 4 : 86400000 * 5 : 0;

  if (!show || !show.episodes || timeToRefresh(show.updatedAt, refreshTime)) {
    const info = await queryTVMaze(id as string, show?.imdbId);
    
    if (!verifyRequiredKeys(info)) {
      return res.status(200).json({ success: false, message: "Invalid show." });
    } else {
      !show ? await Show.create(info) : await Show.findOneAndUpdate({ id }, info);
    }

    showInfo = info;
  } else {
    showInfo = show;
  }

  return res.status(200).json({ success: true, show: showInfo, saved, watched, completed, rating });
}
