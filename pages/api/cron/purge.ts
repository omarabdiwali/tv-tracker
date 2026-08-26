import type { NextApiRequest, NextApiResponse } from 'next';
import Users from '@/models/Users';
import dbConnect from '@/utils/dbConnect';
import { purgeMoviesAndShows } from '@/utils/util';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await dbConnect();
    const fiveDaysAgo = new Date(Date.now() - 86400000 * 5);
    const usersToPurge = await Users.find({ lastPurgedAt: { $lte: fiveDaysAgo } });
    for (const user of usersToPurge) {
      await purgeMoviesAndShows(user);
    }

    return res.status(200).json({ success: true, message: `Purged ${usersToPurge.length} user(s).` });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
