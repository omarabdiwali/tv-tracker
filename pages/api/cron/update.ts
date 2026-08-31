import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/utils/dbConnect';
import { IShow } from '@/utils/types';
import { hasValue } from '@/utils/util';
import Show from '@/models/Show';

const parseEpisodeInfo = (data: any) => {
  if (!data) return;
  const season = data.season;
  const episode = data.number;
  const airdate = data.airdate;
  if (!hasValue(season) || !hasValue(episode) || !hasValue(airdate)) return;

  const episodeString = `${episode}`.padStart(2, '0');
  return `${season}x${episodeString} / ${airdate}`
}

const getEpisodesAndImage = async (showId: string) => {
  const url = `https://api.tvmaze.com/shows/${showId}?embed[]=nextepisode&embed[]=previousepisode`;
  return fetch(url).then(res => res.json()).then(data => {
    if (data.status == 404) return { success: false };
    const showStatus = data.status;
    const img = data.image?.original || data.image?.medium || 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png';
    const imgSmall = data.image?.medium;
    const lastEp = parseEpisodeInfo(data._embedded?.previousepisode);
    const nxtEp = parseEpisodeInfo(data._embedded?.nextepisode);
    return { success: true, lastEp, nxtEp, img, imgSmall, showStatus };
  }).catch(err => {
    return { success: false, lastEp: undefined, nxtEp: undefined, img: undefined, imgSmall: undefined, showStatus: undefined };
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await dbConnect();
    const twoWeeksAgo = new Date(Date.now() - 86400000 * 14);
    const showsToUpdate: IShow[] = await Show.find({ nextUpdatedAt: { $lte: twoWeeksAgo }, status: "Ended" });
    const itemsToUpdate = [];
    
    for (const show of showsToUpdate) {
      const { lastEp, nxtEp, img, imgSmall, showStatus, success } = await getEpisodesAndImage(show.id);
      if (!success) continue;
      
      const status = showStatus ? showStatus : show.status;
      const nextEpisode = nxtEp ? nxtEp : null;
      const lastEpisode = lastEp ? lastEp : null;
      const image = img || show.image;
      const imageSmall = imgSmall || show.imageSmall;
      const nextUpdatedAt = new Date();

      itemsToUpdate.push({
        updateOne: {
          filter: { _id: show._id },
          update: { $set: { status, nextEpisode, lastEpisode, image, imageSmall, nextUpdatedAt } }
        }
      })      
    }

    if (itemsToUpdate.length) await Show.bulkWrite(itemsToUpdate);
    return res.status(200).json({ success: true, message: `${itemsToUpdate.length}/${showsToUpdate.length} show(s) updated!` });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}