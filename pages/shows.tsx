import { AlphaLayout, DateLayout, groupByDate, groupByRatings, groupByStatus, RatingsLayout, sortByAlpha, StatusLayout } from "@/components/ShowsLayouts";
import { ShowWatchlist } from "@/utils/types";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { FaSortAlphaDown, FaStar } from "react-icons/fa";
import { IoIosCalendar, IoIosEye } from "react-icons/io";

const sortButtonClass = "cursor-pointer disabled:cursor-default disabled:opacity-40";

function Title() {
  return (
    <Head>
      <title>Saved Shows | TV Tracker</title>
    </Head>
  )
}

export default function Shows() {
  const router = useRouter();
  const { data: _, status } = useSession();
  const [shows, setShows] = useState<ShowWatchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedSortBy, setSavedSortBy] = useState('alpha');
  const [watchedSortBy, setWatchedSortBy] = useState('ratings');
  const [sortBy, setSortBy] = useState('alpha');
  const [filter, setFilter] = useState('saved');
  const [update, setUpdate] = useState(0);

  const savedShows = useMemo(() => shows.filter(show => show.saved), [shows, update]);
  const watchedShows = useMemo(() => shows.filter(show => show.completed), [shows, update]);
  const activeShows = filter == 'saved' ? savedShows : watchedShows;
  
  const dateGroups = useMemo(() => groupByDate(activeShows), [activeShows]);
  const alphaSorted = useMemo(() => sortByAlpha(activeShows), [activeShows]);
  const statusGroups = useMemo(() => groupByStatus(activeShows), [activeShows]);
  const ratingGropus = useMemo(() => groupByRatings(activeShows), [activeShows]);

  useEffect(() => {
    if (!window) return;
    const validOptions = new Set(['date', 'alpha', 'status', 'ratings']);
    const savedSort = window.localStorage.getItem('savedSortTypeShows');
    const watchedSort = window.localStorage.getItem('watchedSortTypeShows');
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
    fetchSavedShows();
  }, [status])

  const hasAnyEpisode = (show: ShowWatchlist) => show.nextEpisode || show.lastEpisode;

  const doComparison = (a: string | null | undefined, b: string | null | undefined, value: number = 1) => {
    if (!a && !b) return 0;
    if (!a && b) return value;
    if (a && !b) return -value;

    const aDate = (a as string).slice((a as string).indexOf('/') + 2);
    const bDate = (b as string).slice((b as string).indexOf('/') + 2);
    return (new Date(aDate).getTime() - new Date(bDate).getTime()) * value;
  };

  const sortShows = (a: ShowWatchlist, b: ShowWatchlist) => {
    const aHasAny = hasAnyEpisode(a);
    const bHasAny = hasAnyEpisode(b);

    if (!aHasAny && bHasAny) return 1;
    if (aHasAny && !bHasAny) return -1;
    if (!aHasAny && !bHasAny) return 0;

    let res = doComparison(a.nextEpisode, b.nextEpisode);
    if (res === 0) {
      res = doComparison(a.lastEpisode, b.lastEpisode, -1);
    }
    return res;
  };

  const fetchSavedShows = async () => {
    setError('');
    setLoading(true);

    fetch(`/api/show/watchlist`).then(res => res.json()).then(data => {
      if (data.success) {
        const sorted = data.shows.sort(sortShows);
        setShows(sorted);
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

  const removeFromShows = (id: string) => {
    const showsCopy = [...shows];
    const index = showsCopy.findIndex((show) => show.id == id);
    if (index != -1) {
      showsCopy.splice(index, 1);
    }
    setShows(showsCopy);
  }

  const handleSort = (sortType: string) => {
    if (sortType == sortBy) return;
    setSortBy(sortType);
    if (filter == 'saved') {
      window.localStorage.setItem('savedSortTypeShows', sortType); 
      setSavedSortBy(sortType);
    } else {
      window.localStorage.setItem('watchedSortTypeShows', sortType);
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

  const filterButtonClass = "sm:text-2xl md:text-2xl text-md font-bold disabled:text-gray-100 enabled:cursor-pointer text-gray-500";

  return (
    <>
      <Title />
      <div className="flex mb-2 mx-4">
        <div className="flex-1 flex items-center gap-2">
          <button disabled={filter == 'saved'} onClick={() => changeFilter('saved')} className={`${filterButtonClass} hidden sm:block`}>
            Saved Shows
          </button>
          <button disabled={filter == 'saved'} onClick={() => changeFilter('saved')} className={`${filterButtonClass} block sm:hidden`}>
            Saved
          </button>
          <div className="text-2xl font-black text-gray-600">/</div>
          <button disabled={filter == 'watched'} onClick={() => changeFilter('watched')} className={`${filterButtonClass} hidden sm:block`}>
            Watched Shows
          </button>
          <button disabled={filter == 'watched'} onClick={() => changeFilter('watched')} className={`${filterButtonClass} block sm:hidden`}>
            Watched
          </button>
        </div>
        {/* <h2 className="text-2xl font-bold text-gray-100 flex-1">Saved Shows</h2> */}
        <div className="flex items-center gap-2">
          <div>Sort By:</div>
          <button onClick={() => handleSort('alpha')} disabled={sortBy == 'alpha'} title='Alphabetically' className={sortButtonClass}><FaSortAlphaDown size={20} /></button>
          <button onClick={() => handleSort('date')} disabled={sortBy == 'date'} title='Next Episode' className={sortButtonClass}><IoIosCalendar size={20} /></button>
          <button onClick={() => handleSort('status')} disabled={sortBy == 'status'} title='Watch Status' className={sortButtonClass}><IoIosEye size={20} /></button>
          <button onClick={() => handleSort('ratings')} disabled={sortBy == 'ratings'} title='Ratings' className={sortButtonClass}><FaStar size={20} /></button>
        </div>
      </div>
      {activeShows.length == 0 && (
          <div className="flex flex-1 justify-center items-center">
            <div className="text-gray-400">{`There are currently no shows ${filter}.`}</div>
          </div>
        )}
      {activeShows.length > 0 ? sortBy == 'date' ? (
          <DateLayout groups={dateGroups} setUpdate={setUpdate} />
        ) : sortBy == 'alpha' ?  (
          <AlphaLayout shows={alphaSorted} setUpdate={setUpdate} />
        ) : sortBy == 'status' ? (
          <StatusLayout groups={statusGroups} setUpdate={setUpdate} />
        ) : (
          <RatingsLayout groups={ratingGropus} setUpdate={setUpdate} />
        ) : <></>}
    </>
  );
}