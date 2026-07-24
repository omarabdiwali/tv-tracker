import { MovieGenre, MovieDetailsProps } from '@/utils/types';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react';
import { IoIosAddCircleOutline, IoIosCloseCircleOutline, IoIosHourglass, IoIosVideocam } from 'react-icons/io';

const formatNumberOfVotes = (count: string) : string => {
  const parsedCount = parseInt(count);
  if (isNaN(parsedCount)) return '0 votes.';
  if (parsedCount < 1000) return `${count} votes`;
  
  const asThousand = (parsedCount / 1000).toFixed(1);
  return `${asThousand}k votes`;
}

export default function MovieDetails({ movie }: MovieDetailsProps) {
  const { data: _, status } = useSession();
  const [buttonText, setButtonText] = useState(movie.saved ? "Remove from Watchlist" : "Add to Watchlist");
  const [disabled, setDisabled] = useState(false);

  const saveMovie = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if (status != 'authenticated') return;

    const prevText = buttonText;
    setDisabled(true);
    setButtonText("Loading...");

    fetch(`/api/movie/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: `${movie.id}`, title: movie.title, save: prevText == 'Add to Watchlist' })
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
                alt={`${movie.title} poster`}
                src={movie.image}
                width={342}
                height={513}
                priority={true}
                className='rounded-2xl mx-auto'
              />
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                {movie.homepage ? (
                  <Link href={movie.homepage} target='__blank'>
                    <h1 className="text-xl hover:underline font-bold text-gray-900 dark:text-white line-clamp-2">
                      {movie.title}
                    </h1>
                  </Link>
                ) : (
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
                    {movie.title}
                  </h1>
                )}
                {movie.imdbId && <Link
                  href={`https://www.imdb.com/title/${movie.imdbId}`}
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
              
              {movie.voteCount && movie.voteAverage ? 
              (<div className="rounded-lg py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {parseFloat(movie.voteAverage as string).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatNumberOfVotes(movie.voteCount as string)}
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(parseFloat(movie.voteAverage as string || '0') / 10) * 100}%` }}
                  />
                </div>
              </div>) : ''}
              
              <div className="flex flex-wrap gap-2">
                {movie.genres && movie.genres.map((genre: MovieGenre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 bg-slate-600 rounded-full text-sm font-medium duration-200 cursor-default"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-5 rounded-xl">
            <div className='bg-gray-800 p-2 rounded-lg px-3'>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Release Date</div>
              <div className="text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {movie.releaseDate || 'N/A'}
              </div>
            </div>
            
            <div className='bg-gray-800 p-2 rounded-lg px-3'>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Origin</div>
              <div className="text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                  <path d="M2 12h20" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
                {movie.origin?.join(', ') || 'N/A'}
              </div>
            </div>
            
            <div className="col-span-2 sm:col-span-1 bg-gray-800 p-2 px-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Runtime</div>
              <div className="text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {movie.runtime || 'N/A'}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Overview
            </h2>
            
            <div className=" max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-lg">
                {movie.overview || 'No overview available.'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            {movie.video && 
            <Link href={movie.video} target='__blank'>
              <button className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-500 cursor-pointer text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
                <IoIosVideocam size={26} />
                Watch Trailer
              </button>
            </Link>
            }
            
            {movie.imdbId && status == 'authenticated' ? 
            <button disabled={disabled} onClick={saveMovie} className="flex cursor-pointer items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-gray-300 rounded-lg font-semibold enabled:hover:bg-gray-600 transition-all duration-200 transform enabled:hover:scale-105">
              {buttonText == 'Add to Watchlist' ? <IoIosAddCircleOutline size={26} /> : buttonText == 'Loading...' ? <IoIosHourglass size={26} /> : <IoIosCloseCircleOutline size={26} />}
              {buttonText}
            </button> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
