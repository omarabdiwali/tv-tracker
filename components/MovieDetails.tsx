import { MovieGenre, MovieDetailsProps } from '@/utils/types';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react';
import { FaImdb, FaStar } from 'react-icons/fa';
import { IoIosAddCircleOutline, IoIosCheckmarkCircle, IoIosCloseCircleOutline, IoIosGlobe, IoIosHourglass, IoIosVideocam, IoMdCalendar } from 'react-icons/io';
import { RxClock } from 'react-icons/rx';

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
  const [watchStatus, setWatchStatus] = useState(movie.watched);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if (!movie.saved) return;
    setDisabled(true);
    setLoading(true);

    fetch('/api/movie/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: movie.id, status: !watchStatus })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        movie.watched = !watchStatus;
        setWatchStatus(!watchStatus);
      } else {
        if (data.message == 'Unauthenticated user.') {
          window.location.href = '/';
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
        movie.saved = prevText == 'Add to Watchlist';
        movie.watched = false;
        setWatchStatus(false);
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
                unoptimized
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
                    <h1 className="text-xl hover:underline font-bold text-white line-clamp-2">
                      {movie.title}
                    </h1>
                  </Link>
                ) : (
                  <h1 className="text-xl font-bold text-white line-clamp-2">
                    {movie.title}
                  </h1>
                )}
                {movie.imdbId && <Link
                  href={`https://www.imdb.com/title/${movie.imdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full text-sm font-medium transition-colors duration-200"
                >
                  <FaImdb />
                  IMDb
                </Link>}
              </div>

              {movie.voteCount && movie.voteAverage ?
              (<div className="rounded-lg py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaStar size={20} className='text-yellow-500' />
                    <span className="text-2xl font-bold text-white">
                      {parseFloat(movie.voteAverage as string).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatNumberOfVotes(movie.voteCount as string)}
                  </div>
                </div>

                <div className="w-full bg-gray-600 rounded-full h-2">
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
              <div className="text-sm font-semibold text-gray-400 mb-1">Release Date</div>
              <div className="text-white flex items-center gap-2">
                <IoMdCalendar size={18} className='text-blue-400' />
                {movie.releaseDate || 'N/A'}
              </div>
            </div>

            <div className='bg-gray-800 p-2 rounded-lg px-3'>
              <div className="text-sm font-semibold text-gray-400 mb-1">Origin</div>
              <div className="text-white flex items-center gap-2">
                <IoIosGlobe size={18} className='text-green-500' />
                {movie.origin?.join(', ') || 'N/A'}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-gray-800 p-2 px-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-400 mb-1">Runtime</div>
              <div className="text-white flex items-center gap-2">
                <RxClock size={18} className='text-orange-500' />
                {movie.runtime || 'N/A'}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Overview
            </h2>

            <div className=" max-w-none">
              <p className="text-gray-300 whitespace-pre-line text-lg">
                {movie.overview || 'No overview available.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-700">
            {movie.trailer && movie.trailer != 'n/a' &&
            <Link href={movie.trailer} target='__blank'>
              <button className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-500 cursor-pointer text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
                <IoIosVideocam size={26} />
                Watch Trailer
              </button>
            </Link>
            }

            {status == 'authenticated' ?
            <button disabled={disabled} onClick={saveMovie} className="flex cursor-pointer items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-gray-300 rounded-lg font-semibold enabled:hover:bg-gray-600 transition-all duration-200 transform enabled:hover:scale-105">
              {buttonText == 'Add to Watchlist' ? <IoIosAddCircleOutline size={26} /> : buttonText == 'Loading...' ? <IoIosHourglass size={26} /> : <IoIosCloseCircleOutline size={26} />}
              {buttonText}
            </button> : null}

            {status == 'authenticated' && movie.saved ?
            <button disabled={disabled} onClick={handleChange} className={`flex cursor-pointer items-center justify-center gap-2 px-6 py-3 ${watchStatus ? 'bg-green-700 enabled:hover:bg-green-600' : 'bg-gray-700 enabled:hover:bg-gray-600'} text-gray-300 rounded-lg font-semibold transition-all duration-200 transform enabled:hover:scale-105`}>
              {loading ? <IoIosHourglass size={26} /> : <IoIosCheckmarkCircle size={26} />}
              {loading ? 'Loading...' : watchStatus ? 'Watched' : 'Mark As Watched'}
            </button> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// For show, or for later on ratings
/*
{buttonText == 'Remove from Watchlist' && (
  <>
    <div className='flex items-center gap-4 mb-3'>
      <select onChange={handleChange} value={watchStatus} className='bg-gray-700 px-6 py-3 flex-1 rounded-lg'>
        <option key='Unwatched'>Unwatched</option>
        <option key='In Progress'>In Progress</option>
        <option key='Watched'>Watched</option>
      </select>
    </div>
  </>
)}
*/