import Item from "@/components/Item";
import { MovieWatchlist } from "@/utils/types";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { FaSortAlphaDown, FaStar } from "react-icons/fa";
import { IoIosCalendar, IoIosEye } from "react-icons/io";

const ratingsSections = [
  { key: 10, label: '5 Stars ☆' },
  { key: 9, label: '4.5 Stars ☆' },
  { key: 8, label: '4 Stars ☆' },
  { key: 7, label: '3.5 Stars ☆' },
  { key: 6, label: '3 Stars ☆' },
  { key: 5, label: '2.5 Stars ☆' },
  { key: 4, label: '2 Stars ☆' },
  { key: 3, label: '1.5 Stars ☆' },
  { key: 2, label: '1 Stars ☆' },
  { key: 1, label: '0.5 Stars ☆' },
  { key: 0, label: 'Unrated' },
]

function groupByRatings(movies: MovieWatchlist[]) {
  return movies.reduce((acc: Record<string, MovieWatchlist[]>, movie) => {
    const rating = (movie.rating || 0) * 2;
    (acc[rating] ??= []).push(movie);
    return acc;
  }, {});
}

function RatingsLayout({ groups, removeFromMovies } : 
  { groups: Record<string, MovieWatchlist[]>, removeFromMovies: (id: string) => void }) {
  return(
    <div>
      {ratingsSections.map(({ key, label }) => (
        groups[key]?.length && (
          <Fragment key={key}>
            <h2 className="text-xl mb-2 mx-4 font-bold text-gray-400">{label}</h2>
            <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
              {groups[key].map((movie: MovieWatchlist) => (
                <Item
                  key={`movie-saved-${movie.id}`}
                  id={movie.id}
                  title={movie.title}
                  image={movie.image}
                  releaseDate={movie.releaseDate}
                  removeFromMovies={removeFromMovies}
                  saved={true}
                  showReleaseDate
                  type={'movie'}
                />
              ))}
            </div>
          </Fragment>
        )
      ))}
    </div>
  )
}

function Title() {
  return (
    <Head>
      <title>Saved Movies | TV Tracker</title>
    </Head>
  )
}

export default function Movies() {
  const router = useRouter();
  const { data: _, status } = useSession();
  const [movies, setMovies] = useState<MovieWatchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState('alpha');

  const ratingGropus = useMemo(() => groupByRatings(movies), [movies]);

  useEffect(() => {
    if (!window) return;
    const validOptions = new Set(['date', 'alpha', 'status', 'ratings']);
    const sort = window.localStorage.getItem('sortTypeMovies');
    setSortBy(sort && validOptions.has(sort) ? sort : 'alpha');
  }, [])

  useEffect(() => {
    if (status == 'loading') return;
    if (status == 'unauthenticated') {
      router.push('/');
      return;
    }
    fetchSavedMovies();
  }, [status])

  const sortMovies = (a: MovieWatchlist, b: MovieWatchlist) => {
    if (!a.releaseDate && !b.releaseDate) return 0;
    if (!a.releaseDate && b.releaseDate) return 1;
    if (a.releaseDate && !b.releaseDate) return -1;

    const aRelease = new Date(a.releaseDate).getTime();
    const bRelease = new Date(b.releaseDate).getTime();

    return bRelease - aRelease;
  };

  const fetchSavedMovies = async () => {
    setError('');
    setLoading(true);

    fetch(`/api/movie/watchlist`).then(res => res.json()).then(data => {
      if (data.success) {
        const sorted = data.movies.sort(sortMovies);
        setMovies(sorted);
      } else {
        setError(data.message);
      }
    }).catch(err => {
      console.error(err);
      setError(err.message);
    }).finally(() => {
      setLoading(false);
    })
  }

  const removeFromMovies = (id: string) => {
    const moviesCopy = [...movies];
    const index = moviesCopy.findIndex((movie) => movie.id == id);
    if (index != -1) {
      moviesCopy.splice(index, 1);
    }
    setMovies(moviesCopy);
  }

  const handleSort = (sortType: string) => {
    if (sortType == sortBy) return;
    setSortBy(sortType);
    window.localStorage.setItem('sortTypeMovies', sortType);
  }

  if (status != 'authenticated') return null;

  if (error) {
    return (
      <>
        <Title />
        <div>{error}</div>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <Title />
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="w-12 h-12 border-4 border-[#001f3f] border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    )
  }

  const sortButtonClass = "cursor-pointer disabled:cursor-default disabled:opacity-40";

  return (
    <>
      <Title />
      <div className="flex mb-2 mx-4">
        <h2 className="text-2xl font-bold text-gray-100 flex-1">Saved Movies</h2>
        <div className="flex items-center gap-2">
          <div>Sort By:</div>
          <button onClick={() => handleSort('alpha')} disabled={sortBy == 'alpha'} title='Alphabetically' className={sortButtonClass}><FaSortAlphaDown size={20} /></button>
          <button onClick={() => handleSort('date')} disabled={sortBy == 'date'} title='Release Date' className={sortButtonClass}><IoIosCalendar size={20} /></button>
          <button onClick={() => handleSort('status')} disabled={sortBy == 'status'} title='Watch Status' className={sortButtonClass}><IoIosEye size={20} /></button>
          <button onClick={() => handleSort('ratings')} disabled={sortBy == 'ratings'} title='Ratings' className={sortButtonClass}><FaStar size={20} /></button>
        </div>
      </div>
      {movies.length == 0 && (
          <div className="flex flex-1 justify-center items-center">
            <div className="text-gray-400">There are currently no movies saved.</div>
          </div>
        )}
      {movies.length > 0 ? sortBy == 'date' ? (
        <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
          {movies.map((movie) => {
            return <Item
                      key={`movie-saved-${movie.id}`}
                      id={movie.id}
                      title={movie.title}
                      image={movie.image}
                      releaseDate={movie.releaseDate}
                      removeFromMovies={removeFromMovies}
                      saved={true}
                      showReleaseDate
                      type={'movie'}
                    />
          })}
        </div>) : sortBy == 'alpha' ?  (
        <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
          {movies.toSorted((a, b) => a.title.localeCompare(b.title)).map((movie) => {
            return <Item
                      key={`movie-saved-${movie.id}`}
                      id={movie.id}
                      title={movie.title}
                      image={movie.image}
                      releaseDate={movie.releaseDate}
                      removeFromMovies={removeFromMovies}
                      saved={true}
                      showReleaseDate
                      type={'movie'}
                    />
          })}
        </div>) : sortBy == 'ratings' ? (
          <RatingsLayout groups={ratingGropus} removeFromMovies={removeFromMovies} />
        ) : (
          <div>
            <h2 className="text-xl mb-2 mx-4 font-bold text-gray-400 flex-1">Unwatched</h2>
            <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
              {movies.filter(movie => !movie.watched).map((movie) => {
                return <Item
                          key={`movie-saved-${movie.id}`}
                          id={movie.id}
                          title={movie.title}
                          image={movie.image}
                          releaseDate={movie.releaseDate}
                          removeFromMovies={removeFromMovies}
                          saved={true}
                          showReleaseDate
                          type={'movie'}
                        />
              })}
           </div>
           <h2 className="text-xl mb-2 mx-4 font-bold text-gray-400 flex-1">Watched</h2>
            <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
              {movies.filter(movie => movie.watched).map((movie) => {
                return <Item
                          key={`movie-saved-${movie.id}`}
                          id={movie.id}
                          title={movie.title}
                          image={movie.image}
                          releaseDate={movie.releaseDate}
                          removeFromMovies={removeFromMovies}
                          saved={true}
                          showReleaseDate
                          type={'movie'}
                        />
              })}
           </div>
          </div>
        ) : <></>}
    </>
  );
}