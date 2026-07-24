import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import Users from "@/models/Users";
import { IUser } from "@/utils/types";

const getNestedProperty = (data: any, keys: string[], allowUndefined = true) => {
  let current = data;
  let prevKey = null;
  const errorMessage = `Key '${keys.join(".")}' does not exist.`;

  for (const key of keys) {
    if (current === null || current === undefined) {
      if (allowUndefined) return undefined;
      else throw new Error(`${errorMessage} Missing ${prevKey}.${key}.`);
    }
    current = current[key];
    prevKey = key;
  }

  if (current === undefined && !allowUndefined) throw new Error(errorMessage);
  return current;
}

const queryTVMaze = async (queryString: string, savedShows: Set<string>) => {
  const query = encodeURIComponent(queryString);
  const url = `https://api.tvmaze.com/search/shows?q=${query}`;
  
  return fetch(url).then(res => res.json()).then(data => {
    const items = [];
    for (const show of data) {
      const id = getNestedProperty(show, ['show', 'id']);
      const release = getNestedProperty(show, ['show', 'premiered']);
      const name = getNestedProperty(show, ['show', 'name']);
      const isSaved = savedShows.has(`${id}`);

      let image = getNestedProperty(show, ['show', 'image', 'medium']);
      let year = null;

      if (!image) {
        image = getNestedProperty(show, ['show', 'image', 'original']);
      }

      if (id == null || id == undefined || !name || !image) continue;
      if (release) {
        year = release.split("-", 1).at(0);
        if (isNaN(parseInt(year))) {
          year = null;
        }
      }

      items.push({ id, name, image, year, isSaved });
    }

    return items;
  }).catch(err => {
    console.error(err);
    return [];
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q } = req.query;
  if (req.method != "GET") return res.status(200).json({ success: false, message: 'Method not allowed.' })
  if (!q) return res.status(200).json({ success: false, message: 'Missing parameter.' });

  const session = await getServerSession(req, res, authOptions);
  let savedShows: Set<string> = new Set();
  if (!session) {
    return res.status(200).json({ success: false, message: 'Unauthenticated user.' });
  }

  await dbConnect();
  
  const user: IUser | null = await Users.findOne({ email: session.user?.email });
  if (!user) {
    await Users.create({ email: session.user?.email, savedMovies: [], savedShows: [] })
  } else {
    const info = user.savedShows.map((show) => show.showId);
    savedShows = new Set(info);
  }
  
  const shows = await queryTVMaze(q as string, savedShows);
  return res.status(200).json({ success: true, shows });
}
