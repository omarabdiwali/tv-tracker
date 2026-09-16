import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/utils/dbConnect';
import UserMovies from '@/models/UserMovies';
import UserShows from '@/models/UserShows';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await dbConnect();
    const moviesPurged = await UserMovies.deleteMany({ saved: false, watched: false, rating: 0 });
    const showsPurged = await UserShows.deleteMany({ saved: false, completed: false, rating: 0, episodes: null });
    return res.status(200).json({ success: true, message: `Purged ${moviesPurged.deletedCount} movie(s) and ${showsPurged.deletedCount} show(s)!` });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
