import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/utils/dbConnect";
import Users from "@/models/Users";
import { IUser } from "@/utils/types";
import Movie from "@/models/Movie";
import { hasValue, buildPosterURL, getIMDBRatings, correctRatingInfo, verifyRequiredKeys } from "@/utils/util";

const queryTMDB = async (movieId: string, targetTitle: string) => {
  const apiKey = process.env.TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=en-US`;

  return fetch(url).then(res => res.json()).then(async (data) => {
    const id = data.id;
    const title = data.title;
    const genres = data.genres;
    const homepage = data.homepage;
    const imdbId = data.imdb_id;
    const imdbData = await getIMDBRatings(imdbId);
    const ratingInfo = correctRatingInfo(imdbData, data.vote_average, data.vote_count);
    
    const origin = data.origin_country;
    const overview = data.overview;
    const releaseDate = data.release_date;
    const voteCount = ratingInfo.votes;
    const voteAverage = ratingInfo.rating;
    
    const runtime = data.runtime ? `${data.runtime} mins` : data.runtime;
    const image = data.poster_path ? buildPosterURL(data.poster_path, 'w342') : 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png';
    const imageSmall = data.poster_path ? buildPosterURL(data.poster_path, 'w185') : 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png';
    const trailer = "n/a";

    if (title && title != targetTitle) return {};

    return {
      title, genres, trailer, runtime, homepage, imdbId, origin, image,
      imageSmall, overview, releaseDate, voteCount, voteAverage, id
    }
  }).catch(err => {
    console.error(err);
    return {};
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method != "POST") return res.status(200).json({ success: false, message: 'Method not allowed.' });
  const { id, title, save } = req.body;
  const session = await getServerSession(req, res, authOptions);

  if (!session || !hasValue(id) || !title || !hasValue(save)) {
    const message = !session ? "Unauthenticated user." : "Missing body parameters.";
    return res.status(200).json({ success: false, message  });
  }

  await dbConnect();

  let user : IUser | null = await Users.findOne({ email: session.user?.email });
  let index = -1;

  if (!user) {
    user = await Users.create({ email: session.user?.email, movies: [], shows: [] });
  } else {
    index = user.movies.findIndex((movie) => movie.movieId == `${id}`);
  }

  if (!user) return res.status(200).json({ success: false, message: "Error creating user." });
  const movie = await Movie.exists({ id });

  if (!movie) {
    const info = await queryTMDB(id as string, title as string);
    if (!verifyRequiredKeys(info)) {
      return res.status(200).json({ success: false, message: "Invalid movie." });
    }
    await Movie.create(info);
  }

  if (index != -1) {
    const movieObj = user.movies[index];
    if (save == movieObj.saved) {
      return res.status(200).json({ success: true, message: `${title} has already been ${save ? 'saved to' : 'removed from'} watchlist.` });
    }
  }
  
  if (index != -1) {
    user.movies[index].saved = save;
  } else {
    const movieObj = { movieId: `${id}`, saved: save, watched: false, rating: 0 };
    user.movies.push(movieObj);
  }

  user.save();
  return res.status(200).json({ success: true, message: `${title} has been ${save ? "saved to" : "removed from"} watchlist!` });
}
