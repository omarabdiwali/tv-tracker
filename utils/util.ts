import { IMDBData } from "./types";

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