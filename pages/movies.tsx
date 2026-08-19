import Item from "@/components/Item";
import { MovieWatchlist } from "@/utils/types";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Dispatch, Fragment, SetStateAction, useEffect, useMemo, useState } from "react";
import { FaSortAlphaDown, FaStar } from "react-icons/fa";
import { IoIosCalendar } from "react-icons/io";

const ratingsSections = [
  { key: 10, label: '★★★★★' },
  { key: 9, label: '★★★★½' },
  { key: 8, label: '★★★★' },
  { key: 7, label: '★★★½' },
  { key: 6, label: '★★★' },
  { key: 5, label: '★★½' },
  { key: 4, label: '★★' },
  { key: 3, label: '★½' },
  { key: 2, label: '★' },
  { key: 1, label: '½' },
  { key: 0, label: 'Unrated' },
] as const;

function groupByRatings(movies: MovieWatchlist[]) {
  return movies.reduce((acc: Record<string, MovieWatchlist[]>, movie) => {
    const rating = (movie.rating || 0) * 2;
    (acc[rating] ??= []).push(movie);
    return acc;
  }, {});
}

function RatingsLayout({ groups, updateShows } : 
  { groups: Record<string, MovieWatchlist[]>, updateShows: Dispatch<SetStateAction<number>> }) {
  return(
    <div>
      {ratingsSections.map(({ key, label }) => (
        groups[key]?.length && (
          <Fragment key={key}>
            <h2 className={`text-xl mb-2 mx-4 font-bold ${label == 'Unrated' ? 'text-slate-400' : 'text-yellow-400'}`}>{label}</h2>
            <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
              {groups[key].map((movie: MovieWatchlist) => (
                <Item
                  key={`movie-saved-${movie.id}`}
                  id={movie.id}
                  movie={movie}
                  title={movie.title}
                  image={movie.image}
                  releaseDate={movie.releaseDate}
                  updateShows={updateShows}
                  saved={movie.saved}
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
  const [savedSortBy, setSavedSortBy] = useState('alpha');
  const [watchedSortBy, setWatchedSortBy] = useState('ratings');
  const [sortBy, setSortBy] = useState('alpha');  
  const [filter, setFilter] = useState('saved');
  const [update, setUpdate] = useState(0);

  const savedMovies = useMemo(() => movies.filter(movie => movie.saved), [movies, update]);
  const watchedMovies = useMemo(() => movies.filter(movie => movie.watched), [movies, update]);
  const activeMovies = filter == 'saved' ? savedMovies : watchedMovies;
  const ratingGropus = useMemo(() => groupByRatings(activeMovies), [activeMovies]);

  useEffect(() => {
    if (!window) return;
    const validOptions = new Set(['date', 'alpha', 'ratings']);
    const savedSort = window.localStorage.getItem('savedSortTypeMovies');
    const watchedSort = window.localStorage.getItem('watchedSortTypeMovies');
    setSavedSortBy(savedSort && validOptions.has(savedSort) ? savedSort : 'alpha');
    setWatchedSortBy(watchedSort && validOptions.has(watchedSort) ? watchedSort : 'ratings');
    setSortBy(savedSort && validOptions.has(savedSort) ? savedSort : 'alpha');
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
    if (filter == 'saved') {
      window.localStorage.setItem('savedSortTypeMovies', sortType); 
      setSavedSortBy(sortType);
    } else {
      window.localStorage.setItem('watchedSortTypeMovies', sortType);
      setWatchedSortBy(sortType);
    }
  }

  const changeFilter = (filterVal: string) => {
    if (filterVal == 'saved') {
      setSortBy(savedSortBy);
    } else {
      setSortBy(watchedSortBy);
    }
    setFilter(filterVal);
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
  const filterButtonClass = "sm:text-2xl md:text-2xl text-md font-bold disabled:text-gray-100 enabled:cursor-pointer text-gray-500";

  return (
    <>
      <Title />
      <div className="flex mb-2 mx-4">
        <div className="flex-1 flex items-center gap-2">
          <button disabled={filter == 'saved'} onClick={() => changeFilter('saved')} className={`${filterButtonClass} hidden sm:block`}>
            Saved Movies
          </button>
          <button disabled={filter == 'saved'} onClick={() => changeFilter('saved')} className={`${filterButtonClass} block sm:hidden`}>
            Saved
          </button>
          <div className="text-2xl font-black text-gray-600">/</div>
          <button disabled={filter == 'watched'} onClick={() => changeFilter('watched')} className={`${filterButtonClass} hidden sm:block`}>
            Watched Movies
          </button>
          <button disabled={filter == 'watched'} onClick={() => changeFilter('watched')} className={`${filterButtonClass} block sm:hidden`}>
            Watched
          </button>
        </div>
        {/* <h2 className="text-2xl font-bold text-gray-100 flex-1">Saved Movies</h2> */}
        <div className="flex items-center gap-2">
          <div>Sort By:</div>
          <button onClick={() => handleSort('alpha')} disabled={sortBy == 'alpha'} title='Alphabetically' className={sortButtonClass}><FaSortAlphaDown size={20} /></button>
          <button onClick={() => handleSort('date')} disabled={sortBy == 'date'} title='Release Date' className={sortButtonClass}><IoIosCalendar size={20} /></button>
          <button onClick={() => handleSort('ratings')} disabled={sortBy == 'ratings'} title='Ratings' className={sortButtonClass}><FaStar size={20} /></button>
        </div>
      </div>
      {activeMovies.length == 0 && (
          <div className="flex flex-1 justify-center items-center">
            <div className="text-gray-400">{`There are currently no movies ${filter}.`}</div>
          </div>
        )}
      {activeMovies.length > 0 ? sortBy == 'date' ? (
        <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
          {activeMovies.map((movie) => {
            return <Item
                      key={`movie-saved-${movie.id}`}
                      id={movie.id}
                      movie={movie}
                      title={movie.title}
                      image={movie.image}
                      releaseDate={movie.releaseDate}
                      updateShows={setUpdate}
                      saved={movie.saved}
                      showReleaseDate
                      type={'movie'}
                    />
          })}
        </div>) : sortBy == 'alpha' ?  (
        <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
          {activeMovies.toSorted((a, b) => a.title.localeCompare(b.title)).map((movie) => {
            return <Item
                      key={`movie-saved-${movie.id}`}
                      id={movie.id}
                      movie={movie}
                      title={movie.title}
                      image={movie.image}
                      releaseDate={movie.releaseDate}
                      updateShows={setUpdate}
                      saved={movie.saved}
                      showReleaseDate
                      type={'movie'}
                    />
          })}
        </div>) : sortBy == 'ratings' ? (
          <RatingsLayout groups={ratingGropus} updateShows={setUpdate} />
        ) : (
          <div>
            <h2 className="text-xl mb-2 mx-4 font-bold text-gray-400 flex-1">Unwatched</h2>
            <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
              {activeMovies.filter(movie => !movie.watched).map((movie) => {
                return <Item
                          key={`movie-saved-${movie.id}`}
                          id={movie.id}
                          movie={movie}
                          title={movie.title}
                          image={movie.image}
                          releaseDate={movie.releaseDate}
                          updateShows={setUpdate}
                          saved={movie.saved}
                          showReleaseDate
                          type={'movie'}
                        />
              })}
           </div>
           <h2 className="text-xl mb-2 mx-4 font-bold text-gray-400 flex-1">Watched</h2>
            <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
              {activeMovies.filter(movie => movie.watched).map((movie) => {
                return <Item
                          key={`movie-saved-${movie.id}`}
                          id={movie.id}
                          movie={movie}
                          title={movie.title}
                          image={movie.image}
                          releaseDate={movie.releaseDate}
                          updateShows={setUpdate}
                          saved={movie.saved}
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