import { ShowDetailsProps, Episode, EpisodesData } from '@/utils/types';
import sanitizeHtml from 'sanitize-html';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useSnackbar } from 'notistack';
import { useState, useCallback, memo, useEffect, useRef } from 'react';
import { FaImdb, FaStar } from 'react-icons/fa';
import { HiOutlineStatusOnline } from 'react-icons/hi';
import { IoIosAddCircleOutline, IoIosCheckmarkCircle, IoIosCloseCircleOutline, IoIosHourglass, IoMdArrowDropdown, IoMdArrowDropup, IoMdCalendar } from 'react-icons/io';
import { RxClock } from 'react-icons/rx';
import StarRating from './StarRating';
import { useRouter } from 'next/router';

const isElementInViewport = (el: HTMLElement, parent: HTMLElement | null) => {
  const rect = el.getBoundingClientRect();

  if (parent) {
    const parentRect = parent.getBoundingClientRect();
    return (
      rect.top >= parentRect.top &&
      rect.left >= parentRect.left &&
      rect.bottom <= parentRect.bottom &&
      rect.right <= parentRect.right
    );
  }

  const viewHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewWidth = window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= viewHeight &&
    rect.right <= viewWidth
  );
}

const EpisodeItem = memo(({ episode, watched, onToggleWatched }: {
  episode: Episode;
  watched: Set<string>;
  onToggleWatched: (id: string | number, watched: boolean) => Promise<boolean>
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const handleClick = useCallback(async () => {
    setIsLoading(true);
    const newWatched = !watched.has(`${episode.id}`);
    await onToggleWatched(episode.id, newWatched);
    setIsLoading(false);
  }, [episode.id, watched, onToggleWatched]);

  return (
    <div id={`${episode.id}`} className="flex items-start justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded">
            Ep {episode.number}
          </span>
          <h4 className="font-semibold text-white text-sm sm:text-base line-clamp-1">
            {episode.title}
          </h4>
        </div>
        <div className="text-xs text-gray-400 mb-2">
          {episode.airdate || 'N/A'}
        </div>
        {episode.summary && (
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml((episode.summary || 'No summary.'))}} className="text-xs text-gray-300" />
        )}
      </div>

      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`ml-3 flex-shrink-0 enabled:cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
          watched.has(`${episode.id}`)
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
        } disabled:opacity-50`}
      >
        {isLoading ? (
          <IoIosHourglass size={14} className="animate-spin" />
        ) : watched.has(`${episode.id}`) ? (
          <IoIosCloseCircleOutline size={14} />
        ) : (
          <IoIosAddCircleOutline size={14} />
        )}
        {watched.has(`${episode.id}`) ? 'Watched' : 'Mark Watched'}
      </button>
    </div>
  );
});

const SeasonSection = ({
  seasonNumber,
  episodes,
  watched: initialWatched,
  onToggleWatched,
  onMarkAllWatched
}: {
  seasonNumber: number;
  episodes: Episode[];
  watched: Set<string>;
  onToggleWatched: (id: string | number, watched: boolean) => Promise<boolean>;
  onMarkAllWatched: (episodeIds: (string | number)[], watched: boolean) => Promise<boolean>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [watched, setWatched] = useState(initialWatched);
  const [watchedCount, setWatchedCount] = useState(episodes.filter(ep => watched.has(`${ep.id}`)).length);
  const [loading, setLoading] = useState(false);
  const [scrollEpisode, setScrollEpisode] = useState<string | null>(null);
  const seasonRef = useRef(null);
  const nextEpRef = useRef<string | null>(null);

  useEffect(() => {
    const unwatchedEpisodes = episodes.filter(ep => !watched.has(`${ep.id}`));
    const firstId = unwatchedEpisodes.at(0)?.id;
    nextEpRef.current = firstId ? `${firstId}` : null;
    setWatchedCount(episodes.length - unwatchedEpisodes.length);
  }, [episodes, watched])

  useEffect(() => {
    if (!isOpen) {
      setScrollEpisode(nextEpRef.current);
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !scrollEpisode || !seasonRef.current) return;
    
    const timeoutId = setTimeout(() => {
      const element = document.getElementById(scrollEpisode);
      const scrollContainer = seasonRef.current;

      if (!element || !scrollContainer) return;
      const isVisible = isElementInViewport(element, scrollContainer);

      if (!isVisible) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [isOpen, scrollEpisode])

  const handleToggleWatched = useCallback(async (episodeId: string | number, setToWatched: boolean) => {
    const result = await onToggleWatched(episodeId, setToWatched);
    if (result) {
      setWatched((prev) => {
        const prevCopy = new Set(prev);
        setToWatched ? prevCopy.add(`${episodeId}`) : prevCopy.delete(`${episodeId}`);
        return prevCopy;
      })
    }
    return result;
  }, [onToggleWatched]);

  const handleMarkAllClick = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    const episodeIds = episodes.map((ep) => ep.id);
    const watchStatus = watchedCount < episodes.length;
    const result = await onMarkAllWatched(episodeIds, watchStatus);

    if (result) {
      setWatched((prev) => {
        const prevCopy = new Set(prev);
        episodeIds.forEach(ep => watchStatus ? prevCopy.add(`${ep}`) : prevCopy.delete(`${ep}`));
        return prevCopy;
      })
    }
    setLoading(false);
  }, [onMarkAllWatched, seasonNumber, episodes, watchedCount]);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center cursor-pointer justify-between p-4 bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white">
            Season {seasonNumber}
          </h3>
          <span className="text-sm text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
            {episodes.length} Episodes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-green-400">
            {watchedCount}/{episodes.length} Watched
          </span>
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleMarkAllClick();
            }}
            className={`flex items-center gap-1 px-2 py-1 text-xs ${watchedCount == episodes.length ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600/80 hover:bg-gray-500 text-gray-300'} cursor-pointer text-white rounded-full transition-colors duration-200`}
          >
            {loading ? 'Loading...' : watchedCount < episodes.length ? 'Mark All Watched' : 'Watched'}
          </div>
          {isOpen ? <IoMdArrowDropup size={20} /> : <IoMdArrowDropdown size={20} />}
        </div>
      </button>

      {isOpen && (
        <div ref={seasonRef} className="p-3 space-y-2 max-h-96 overflow-y-auto bg-gray-800/50">
          {episodes.map(episode => (
            <EpisodeItem
              key={episode.id}
              episode={episode}
              watched={watched}
              onToggleWatched={handleToggleWatched}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface EpisodeListProps {
  showId: string | number;
  episodes: EpisodesData;
  watched: Set<string>;
}

function EpisodeList({ showId, episodes, watched }: EpisodeListProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleToggleWatched = useCallback(async (episodeId: string | number, setWatched: boolean) => {
    const reqBody = {
      showId: `${showId}`,
      epId: `${episodeId}`,
      setWatched
    };

    return fetch('/api/show/watched', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reqBody)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        return true;
      } else {
        if (data.message == "Unauthenticated user.") {
          window.location.href = '/';
          return false;
        }
        enqueueSnackbar(data.message, { variant: 'error', autoHideDuration: 1500 });
        return false;
      }
    })
    .catch(err => {
      console.error(err);
      enqueueSnackbar('Failed to update watched status', { variant: 'error', autoHideDuration: 1500 });
      return false;
    });
  }, [showId, enqueueSnackbar]);

  const handleMarkAllWatched = useCallback(async (episodeIds: (string | number)[], watchStatus: boolean) => {
    const reqBody = {
      showId: `${showId}`,
      episodeIds,
      watched: watchStatus
    };

    return fetch('/api/show/watchedSeason', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reqBody)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        return true;
      } else {
        if (data.message == "Unauthenticated user.") {
          window.location.href = '/';
          return false;
        }
        enqueueSnackbar(data.message, { variant: 'error', autoHideDuration: 1500 });
        return false;
      }
    })
    .catch(err => {
      console.error(err);
      enqueueSnackbar('Failed to update watched status', { variant: 'error', autoHideDuration: 1500 });
      return false;
    });
  }, [showId, enqueueSnackbar]);

  const seasonNumbers = Object.keys(episodes)
    .map(Number)
    .sort((a, b) => a - b);

  if (!episodes || seasonNumbers.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400">
        No episodes available for this show.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {seasonNumbers.map(seasonNum => (
        <SeasonSection
          key={seasonNum}
          seasonNumber={seasonNum}
          episodes={episodes[seasonNum]}
          watched={watched}
          onToggleWatched={handleToggleWatched}
          onMarkAllWatched={handleMarkAllWatched}
        />
      ))}
    </div>
  );
}

interface InfoBoxesProps {
  status: string | null | undefined;
  releaseDate: string | null | undefined;
  lastEpisode: string | null | undefined;
  nextEpisode: string | null | undefined;
}

function InfoBoxes({ status, releaseDate, lastEpisode, nextEpisode } : InfoBoxesProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-5 rounded-xl">
      <div className='bg-gray-800 p-2 rounded-lg px-3'>
        <div className="text-sm font-semibold text-gray-400 mb-1">Release Date</div>
        <div className="text-white flex items-center gap-2">
          <IoMdCalendar size={18} className='text-blue-400' />
          {releaseDate || 'N/A'}
        </div>
      </div>

      {(!lastEpisode || !nextEpisode) && <div className="col-span-2 sm:col-span-1 bg-gray-800 p-2 px-3 rounded-lg">
        <div className="text-sm font-semibold text-gray-400 mb-1">Status</div>
        <div className="text-white flex items-center gap-2">
          <HiOutlineStatusOnline size={18} className='text-green-400' />
          {status ? status : 'N/A'}
        </div>
      </div>}

      {lastEpisode && nextEpisode && <div className="col-span-2 sm:col-span-1 bg-gray-800 p-2 px-3 rounded-lg">
        <div className="text-sm font-semibold text-gray-400 mb-1">Last Episode</div>
        <div className="text-white flex items-center gap-2">
          <RxClock size={18} className='text-orange-300' />
          {lastEpisode}
        </div>
      </div>}

      {(lastEpisode || nextEpisode) && <div className="col-span-2 sm:col-span-1 bg-gray-800 p-2 px-3 rounded-lg">
        <div className="text-sm font-semibold text-gray-400 mb-1">{nextEpisode ? 'Next Episode' : 'Last Episode'}</div>
        <div className="text-white flex items-center gap-2">
          <RxClock size={18} className='text-orange-500' />
          {nextEpisode ? nextEpisode : lastEpisode}
        </div>
      </div>}
    </div>
  )
}

export default function ShowDetails({ show }: ShowDetailsProps) {
  const { data: _, status } = useSession();
  const [buttonText, setButtonText] = useState(show.saved ? "Remove from Watchlist" : "Add to Watchlist");
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(!!show.completed);
  const [imgSrc, setImgSrc] = useState(show.image || 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png');
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();

  const handleChange = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    
    if (status == 'unauthenticated') {
      router.push('/');
      return;
    } else if (disabled) {
      return;
    }

    setDisabled(true);
    setLoading(true);

    fetch('/api/show/completed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: `${show.id}`, completed: !completed })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        show.completed = !completed;
        setCompleted(!completed);
      } else {
        if (data.message == 'Unauthenticated user.') {
          router.push('/');
          return;
        }
        enqueueSnackbar(data.message, { variant: 'error', autoHideDuration: 1500 });
      }
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setDisabled(false);
      setLoading(false);
    })
  }

  const saveShow = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if (status != 'authenticated') return;

    const prevText = buttonText;
    setDisabled(true);
    setButtonText("Loading...");

    fetch(`/api/show/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: `${show.id}`, title: show.title, save: prevText == 'Add to Watchlist' })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        setButtonText(prevText == 'Add to Watchlist' ? "Remove from Watchlist" : "Add to Watchlist");
        enqueueSnackbar(data.message, { variant: 'success', autoHideDuration: 1500 });
      } else {
        if (data.message == 'Unauthenticated user.') {
          window.location.href = '/';
          return;
        } else {
          setButtonText(prevText);
          enqueueSnackbar(data.message, { variant: 'error', autoHideDuration: 1500 });
        }
      }
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setDisabled(false);
    })
  }

  return (
    <div className="flex h-full w-full mx-auto p-4 sm:p-6 lg:p-8">
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="mx-auto overflow-hidden shadow-2xl transform transition-transform duration-300 hover:scale-105">
              <Image
                unoptimized={imgSrc == 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png' ? true : false}
                alt={`${show.title} poster`}
                src={imgSrc}
                width={342}
                height={513}
                preload={true}
                className='rounded-2xl mx-auto'
                onError={() => setImgSrc('https://static.tvmaze.com/images/no-img/no-img-portrait-text.png')}
              />
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                {show.homepage ? (
                  <Link href={show.homepage} target='__blank'>
                    <h1 className="text-xl hover:underline font-bold text-white line-clamp-2">
                      {show.title}
                    </h1>
                  </Link>
                ) : (
                  <h1 className="text-xl font-bold text-white line-clamp-2">
                    {show.title}
                  </h1>
                )}
                {show.imdbId && <Link
                  href={`https://www.imdb.com/title/${show.imdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full text-sm font-medium transition-colors duration-200"
                >
                  <FaImdb />
                  IMDb
                </Link>}
              </div>

              {show.voteAverage ?
              (<div className="rounded-lg py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaStar size={20} className='text-yellow-500' />
                    <span className="text-2xl font-bold text-white">
                      {parseFloat(show.voteAverage as string).toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(parseFloat(show.voteAverage as string || '0') / 10) * 100}%` }}
                  />
                </div>
              </div>) : ''}

              <div className="flex flex-wrap gap-2">
                {show.genres && show.genres.map((genre: string) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-slate-600 rounded-full text-sm font-medium duration-200 cursor-default"
                  >
                    {genre}
                  </span>
                ))}
                {show.language && <span
                  className="px-3 py-1 bg-green-800 rounded-full text-sm font-medium duration-200 cursor-default"
                >
                  {show.language}
                </span>}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <InfoBoxes
            status={show.status}
            releaseDate={show.releaseDate}
            lastEpisode={show.lastEpisode}
            nextEpisode={show.nextEpisode}
          />

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Overview
            </h2>

            {show.overview ? <div className="max-w-none whitespace-pre-line text-gray-300 text-lg space-y-3" dangerouslySetInnerHTML={{ __html: sanitizeHtml(show.overview) }} /> : (
              <div className="max-w-none">
                <p className="text-gray-300 whitespace-pre-line text-lg">
                  No overview available.
                </p>
            </div>
            )}
          </div>

          <div className="flex flex-col items-center sm:flex-row gap-4 pb-6 border-b border-gray-700">
            <button disabled={disabled} onClick={saveShow} className="flex cursor-pointer items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-gray-300 rounded-lg font-semibold enabled:hover:bg-gray-600 transition-all duration-200 transform enabled:hover:scale-105">
              {buttonText == 'Add to Watchlist' ? <IoIosAddCircleOutline size={26} /> : buttonText == 'Loading...' ? <IoIosHourglass size={26} /> : <IoIosCloseCircleOutline size={26} />}
              {buttonText}
            </button>
            <button disabled={disabled} onClick={handleChange} className={`flex cursor-pointer items-center justify-center gap-2 px-6 py-3 ${completed ? 'bg-green-700 enabled:hover:bg-green-600' : 'bg-gray-700 enabled:hover:bg-gray-600'} text-gray-300 rounded-lg font-semibold transition-all duration-200 transform enabled:hover:scale-105`}>
              {loading ? <IoIosHourglass size={26} /> : <IoIosCheckmarkCircle size={26} />}
              {loading ? 'Loading...' : completed ? 'Completed' : 'Mark As Completed'}
            </button>
            <StarRating rating={show.rating || 0} id={`${show.id}`} type={'show'} />
          </div>

          {status == 'authenticated' && show.episodes && Object.keys(show.episodes).length > 0 && (
            <div className="space-y-4">
              <div className='flex items-center'>
                <h2 className="flex-1 text-2xl font-bold text-white">
                  Episodes
                </h2>
                {show.episodeCount && <div className='text-md font-bold text-gray-400'>
                  {`${show.episodeCount} ${show.episodeCount > 1 ? 'Episodes' : 'Episode'}`}
                </div>}
              </div>
              <EpisodeList
                showId={show.id}
                episodes={show.episodes}
                watched={show.watched}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}