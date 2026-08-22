import { IMDBData, IUser, SeasonEpisodeCountType } from "./types";

export const wikiLangEd = `enwiki,jawiki,eswiki,dewiki,ruwiki,frwiki,itwiki,zhwiki,ptwiki,plwiki,arwiki,fawiki,idwiki,nlwiki,trwiki,ukwiki,hewiki,svwiki,kowiki,cswiki,viwiki,huwiki,fiwiki,rowwiki,thwiki,elwiki,srwiki,dawiki,bgwiki,hrwiki,skwiki,nowiki,mswiki,cawiki,hiwiki,ltwiki,tawiki,slwiki,etwiki,lvwiki,bnwiki,urwiki,kawiki,sqwiki,azwiki,tewiki,mlwiki,glwiki,mkwiki,kkwiki`

export const timeToRefresh = (from: Date, refreshTime: number): boolean => {
  const current = new Date().getTime();
  const fromMs = new Date(from).getTime();
  return (current - fromMs) >= refreshTime;
}

export const getNestedProperty = (data: any, keys: string[], allowUndefined = true) => {
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

export const hasValue = (val: any) => {
  return val != undefined && val != null;
}

export const verifyRequiredKeys = (info: any) => {
  const { id, image, title } = info;
  return hasValue(id) && hasValue(image) && hasValue(title);
}

export const buildPosterURL = (path: string, size: string) => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export const correctRatingInfo = (imdbData: IMDBData, otherRating: any, otherVotes?: any) : IMDBData => {
  if (imdbData.rating && imdbData.votes) return imdbData;
  return {
    votes: otherVotes,
    rating: otherRating
  }
}

export const getIMDBRatings = async (id: string | undefined) : Promise<IMDBData> => {
  if (!id) return {};
  const url = `https://api.agregarr.org/api/ratings?id=${id}`;  
  return fetch(url).then(res => res.json()).then(data => {
    const imdbData = data.at(0);
    const rating = imdbData ? imdbData.rating : undefined;
    const votes = imdbData ? imdbData.votes : undefined;
    return { rating, votes };
  })
}

export const formatNumberOfVotes = (count: string | number) : string => {
  const parsedCount = typeof count == 'string' ? parseInt(count) : count;
  if (isNaN(parsedCount)) return '0 votes.';
  if (parsedCount < 1000) return `${count} votes`;

  if (parsedCount < 1000000) {
    const asThousand = (parsedCount / 1000).toFixed(1);
    return `${asThousand}k votes`;
  } else {
    const asMillion = (parsedCount / 1000000).toFixed(1);
    return `${asMillion}M votes`;
  }
}

export const purgeMoviesAndShows = async (user: IUser) => {
  const refreshTime = 86400000 * 5;
  if (timeToRefresh(user.lastPurgedAt, refreshTime)) {
    const userMovies = [];
    const userShows = [];

    for (const movie of user.movies) {
      if (movie.rating || movie.saved || movie.watched) {
        userMovies.push(movie);
      }
    }

    for (const show of user.shows) {
      if (show.rating || show.saved || show.completed || show.watchedEpisodes.length) {
        userShows.push(show);
      }
    }

    user.movies = userMovies;
    user.shows = userShows;
    user.lastPurgedAt = new Date();
    await user.save();
  }
}

export const getCorrectImdbId = (prev: string | undefined, current: string | undefined) => {
  if (prev && !current) return prev;
  return current;
}

export const getNextEpisodeNumber = (nextEpisode: string | undefined | null, seasonEpisodeCount: SeasonEpisodeCountType | undefined) => {
  if (nextEpisode == null || nextEpisode == undefined) return;

  const end = nextEpisode.indexOf(' / ');
  if (end == -1) return;
  const seasonAndNumber = nextEpisode.slice(0, end);
  const [season, number] = seasonAndNumber.split('x').map(v => v.length == 0 ? Number('a') : Number(v));
  if (number == undefined || isNaN(number) || isNaN(season)) return;

  const passedEpisodes = getPassedEpisodes(season, seasonEpisodeCount);
  return passedEpisodes + number;
}

const getPassedEpisodes = (season: number | undefined, seasonEpisodeCount: SeasonEpisodeCountType | undefined) => {
  if (!season || season == 1 || !seasonEpisodeCount) return 0;
  let passedEpisodes = 0;
  for (const [prevSeason, count] of Object.entries(seasonEpisodeCount)) {
    if (prevSeason == 'total') continue;
    const prevSeasonInt = parseInt(prevSeason);
    if (prevSeasonInt < season) {
      passedEpisodes += count;
    }
  }

  return passedEpisodes;
}