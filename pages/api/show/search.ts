import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import Users from "@/models/Users";
import { IUser, StatusObjType } from "@/utils/types";
import { getNestedProperty, hasValue } from "@/utils/util";

const getYear = (str: string) => {
  return str.split('-', 1).at(0);
}

const queryTVMaze = async (queryString: string, statusInfo: StatusObjType) => {
  const query = encodeURIComponent(queryString);
  const url = `https://api.tvmaze.com/search/shows?q=${query}`;

  return fetch(url).then(res => res.json()).then(data => {
    const items = [];
    const noImageItems = [];

    for (const show of data) {
      const id = getNestedProperty(show, ['show', 'id']);
      const releaseDate = getNestedProperty(show, ['show', 'premiered']);
      const title = getNestedProperty(show, ['show', 'name']);
      
      const statusVal = `${id}` in statusInfo ? statusInfo[`${id}`] : -2;
      const saved = statusVal == 0 || statusVal == 1;
      const watched = statusVal == 0 || statusVal == -1;

      let image = getNestedProperty(show, ['show', 'image', 'medium']);
      if (!image) {
        image = getNestedProperty(show, ['show', 'image', 'original']);
        image = image || 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png';
      }

      if (!hasValue(id) || !title || !image) continue;
      if (image == 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png') {
        if (!releaseDate || Number(getYear(releaseDate)) < 1970) continue;
        noImageItems.push({ id, title, image, releaseDate, saved, watched });
      } else {
        items.push({ id, title, image, releaseDate, saved, watched });
      }
    }

    return items.concat(noImageItems);
  }).catch(err => {
    console.error(err);
    return [];
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q } = req.query;
  const session = await getServerSession(req, res, authOptions);

  if (req.method != "GET") return res.status(200).json({ success: false, message: 'Method not allowed.' })
  if (!q) return res.status(200).json({ success: false, message: 'Missing parameter.' });
  if (!session) return res.status(200).json({ success: false, message: 'Unauthenticated user.' });

  await dbConnect();
  const user: IUser | null = await Users.findOne({ email: session.user?.email });
  let statusInfo: StatusObjType = {};

  if (!user) {
    await Users.create({ email: session.user?.email, movies: [], shows: [] })
  } else {
    statusInfo = user.shows.reduce((acc: StatusObjType, show) => {
      if (!show.completed && !show.saved) return acc;
      acc[show.showId] = -(Number(show.completed || 0)) + Number(show.saved || 0);
      return acc;
    }, {})
  }

  const shows = await queryTVMaze(q as string, statusInfo);
  return res.status(200).json({ success: true, shows });
}
