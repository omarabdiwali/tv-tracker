import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import Users from "@/models/Users";
import { IUser, EpisodesData } from "@/utils/types";


const parseEpisodes = (episodes: any, watchedList: Set<string>): EpisodesData => {
  if (!episodes) return {};

  const seasons: EpisodesData = {};
  for (const episode of episodes) {
    const id = episode.id;
    const title = episode.name;
    const season: number = episode.season;
    const number = episode.number;
    const airdate = episode.airdate;
    const rating = episode.rating.average;
    const summary = episode.summary;
    const watched = watchedList.has(`${id}`);

    if (!id || !title || !number || !airdate || !season) continue;
    if (!(season in seasons)) {
      seasons[season] = [];
    }

    seasons[season].push({ id, title, number, airdate, rating, summary, watched });
  }

  return seasons;
}

const queryTVMaze = async (showId: string, saved: boolean, watched: Set<string>) => {
  const url = `https://api.tvmaze.com/shows/${showId}?embed=episodes`;

  return fetch(url).then(res => res.json()).then(data => {
    const id = data.id;
    const title = data.name;
    const genres = data.genres;
    const homepage = data.officialSite;
    const imdbId = data.externals?.imdb;

    const language = data.language;
    const overview = data.summary;
    const releaseDate = data.premiered;
    const voteAverage = data.rating?.average;
    const status = data.status;
    const episodes = parseEpisodes(data._embedded.episodes, watched);
    
    let image = data.image?.original;
    if (!image) {
      image = data.image?.medium;
    }
    
    return {
      title, genres, language, status, homepage, imdbId, image,
      overview, releaseDate, voteAverage, id, saved, episodes
    }
  }).catch(err => {
    console.error(err);
    return {};
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method != "GET") return res.status(200).json({ success: false, message: 'Method not allowed.' })
  if (!id) return res.status(200).json({ success: false, message: 'Missing parameter.' });

  const session = await getServerSession(req, res, authOptions);
  let saved = false;
  let watched: Set<string> = new Set();

  if (session) {
    await dbConnect();
    const user: IUser | null = await Users.findOne({ email: session.user?.email });
    if (!user) {
      await Users.create({ email: session.user?.email, savedMovies: [], savedShows: [] });
    } else {
      const index = user.savedShows.findIndex((show) => show.showId == `${id}`);
      saved = index != -1;
      watched = saved ? new Set(user.savedShows[index].watchedEpisodes) : watched;
    }
  }

  const info = await queryTVMaze(id as string, saved, watched);
  return res.status(200).json({ success: true, show: info });
}
