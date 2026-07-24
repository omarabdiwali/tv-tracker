import { ShowDetailsProps, Episode, EpisodesData } from '@/utils/types';
import DOMPurify from 'isomorphic-dompurify'
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { enqueueSnackbar, useSnackbar } from 'notistack';
import { useState, useCallback, memo } from 'react';
import { IoIosAddCircleOutline, IoIosCloseCircleOutline, IoIosHourglass, IoMdArrowDropdown, IoMdArrowDropup } from 'react-icons/io';

const EpisodeItem = memo(({ episode, onToggleWatched }: { 
  episode: Episode;
  onToggleWatched: (id: string | number, watched: boolean, episode: number) => Promise<boolean> 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setIsLoading(true);
    const newWatched = !episode.watched;
    await onToggleWatched(episode.id, newWatched, episode.number);
    setIsLoading(false);
  }, [episode.id, episode.watched, onToggleWatched]);

  return (
    <div className="flex items-start justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200">
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
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(episode.summary || 'No summary')}} className="text-xs text-gray-300" />
        )}
      </div>
      
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`ml-3 flex-shrink-0 enabled:cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
          episode.watched 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
        } disabled:opacity-50`}
      >
        {isLoading ? (
          <IoIosHourglass size={14} className="animate-spin" />
        ) : episode.watched ? (
          <IoIosCloseCircleOutline size={14} />
        ) : (
          <IoIosAddCircleOutline size={14} />
        )}
        {episode.watched ? 'Watched' : 'Mark Watched'}
      </button>
    </div>
  );
});

const SeasonSection = ({ 
  seasonNumber, 
  episodes: initialEpisodes, 
  onToggleWatched 
}: { 
  seasonNumber: number; 
  episodes: Episode[]; 
  onToggleWatched: (id: string | number, watched: boolean, season: number, episode: number) => Promise<boolean> 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>(initialEpisodes);
  
  const watchedCount = episodes.filter(ep => ep.watched).length;
  
  const handleToggleWatched = useCallback(async (episodeId: string | number, setWatched: boolean, episode: number) => {
    const result = await onToggleWatched(episodeId, setWatched, seasonNumber, episode);
    if (result) {
      setEpisodes(prev => prev.map(ep => 
        ep.id === episodeId ? { ...ep, watched: setWatched } : ep
      ));
    }
    return result;
  }, [onToggleWatched]);
  
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
          {isOpen ? <IoMdArrowDropup size={20} /> : <IoMdArrowDropdown size={20} />}
        </div>
      </button>
      
      {isOpen && (
        <div className="p-3 space-y-2 max-h-96 overflow-y-auto bg-gray-800/50">
          {episodes.map(episode => (
            <EpisodeItem 
              key={episode.id} 
              episode={episode}
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
}

function EpisodeList({ showId, episodes }: EpisodeListProps) {
  const { enqueueSnackbar } = useSnackbar();
  
  const handleToggleWatched = useCallback(async (episodeId: string | number, setWatched: boolean, season: number, episode: number) => {
    const reqBody = { 
      showId, 
      epId: episodeId, 
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
        enqueueSnackbar(`S${season} E${episode} ${data.message}`, { variant: 'success', autoHideDuration: 1500 });
        return true;
      } else {
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
          onToggleWatched={handleToggleWatched}
        />
      ))}
    </div>
  );
}

export default function ShowDetails({ show }: ShowDetailsProps) {
  const { data: _, status } = useSession();
  const [buttonText, setButtonText] = useState(show.saved ? "Remove from Watchlist" : "Add to Watchlist");
  const [disabled, setDisabled] = useState(false);

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
                alt={`${show.title} poster`}
                src={show.image}
                width={342}
                height={513}
                priority={true}
                className='rounded-2xl mx-auto'
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
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z"/>
                  </svg>
                  IMDb
                </Link>}
              </div>
              
              {show.voteAverage ? 
              (<div className="rounded-lg py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
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
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-5 rounded-xl">
            <div className='bg-gray-800 p-2 rounded-lg px-3'>
              <div className="text-sm font-semibold text-gray-400 mb-1">Release Date</div>
              <div className="text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {show.releaseDate || 'N/A'}
              </div>
            </div>
            
            <div className='bg-gray-800 p-2 rounded-lg px-3'>
              <div className="text-sm font-semibold text-gray-400 mb-1">Language</div>
              <div className="text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                  <path d="M2 12h20" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
                {show.language || 'N/A'}
              </div>
            </div>
            
            <div className="col-span-2 sm:col-span-1 bg-gray-800 p-2 px-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-400 mb-1">Status</div>
              <div className="text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {show.status || 'N/A'}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Overview
            </h2>
            
            {show.overview ? <div className="max-w-none whitespace-pre-line text-gray-300 text-lg space-y-3" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(show.overview) }} /> : (
              <div className="max-w-none">
                <p className="text-gray-300 whitespace-pre-line text-lg">
                  No overview available.
                </p>
            </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 pb-6 border-b border-gray-700">
            {show.imdbId && status == 'authenticated' ? 
            <button disabled={disabled} onClick={saveShow} className="flex cursor-pointer items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-gray-300 rounded-lg font-semibold enabled:hover:bg-gray-600 transition-all duration-200 transform enabled:hover:scale-105">
              {buttonText == 'Add to Watchlist' ? <IoIosAddCircleOutline size={26} /> : buttonText == 'Loading...' ? <IoIosHourglass size={26} /> : <IoIosCloseCircleOutline size={26} />}
              {buttonText}
            </button> : null}
          </div>

          {status == 'authenticated' && show.episodes && Object.keys(show.episodes).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">
                Episodes
              </h2>
              <EpisodeList 
                showId={show.id} 
                episodes={show.episodes} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}