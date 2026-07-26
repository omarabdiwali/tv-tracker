import { SeasonEpisodeCountType, ShowWatchlist } from "@/utils/types";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { IoIosAdd, IoIosCalendar, IoIosHourglass, IoIosCheckmarkCircleOutline, IoIosRemove } from "react-icons/io";

interface ItemProps {
  id: string,
  title: string,
  image: string,
  imageSmall?: string,
  nextEpisode: string | undefined | null,
  lastEpisode: string | undefined | null,
  releaseDate?: string,
  authStatus: 'unauthenticated' | 'authenticated' | 'loading';
  showStatus: string,
  removeFromShows: (id: string) => void;
  episodeCount?: number,
  episodesWatched?: number,
  seasonEpisodeCount?: SeasonEpisodeCountType
}

function Item({ id, image, imageSmall, title, releaseDate, episodeCount, episodesWatched,
  seasonEpisodeCount, nextEpisode, lastEpisode, showStatus, authStatus, removeFromShows }: ItemProps) {
  const [action, setAction] = useState('remove');
  const [disabled, setDisabled] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const year = releaseDate ? releaseDate.split('-', 1).at(0) : null;
  const notEndedAndLast = showStatus != 'Ended' && !nextEpisode && lastEpisode;

  const saveItem = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();

    const prevAction = action;
    setDisabled(true);
    setAction('loading');

    fetch(`/api/show/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id, title, save: prevAction == 'add' })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        setAction(prevAction == 'add' ? 'remove' : 'add');
        enqueueSnackbar(data.message, { variant: "success", autoHideDuration: 1500 });
        if (prevAction == 'remove') {
          removeFromShows(id);
        }
      } else {
        if (data.message == 'Unauthenticated user.') {
          window.location.href = '/';
          return;
        } else {
          enqueueSnackbar(data.message, { variant: "error", autoHideDuration: 1500 });
        }
      }
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setDisabled(false);
    })
  }

  const WatchedBanner = () => {
    if (episodeCount == 0 || episodeCount == undefined || episodeCount == null || episodesWatched == undefined || episodesWatched == null) {
      return <div className="absolute top-[0%] w-full bg-red-600 h-1" />;
    }

    const getPassedEpisodes = (season: number | undefined) => {
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

    const getNextEpisode = () => {
      if (nextEpisode == null || nextEpisode == undefined) return null;

      const end = nextEpisode.indexOf(' / ');
      if (end == -1) return null;
      const seasonAndNumber = nextEpisode.slice(0, end);
      const [season, number] = seasonAndNumber.split('x').map(v => v.length == 0 ? Number('a') : Number(v));
      if (number == undefined || isNaN(number) || isNaN(season)) return null;

      const passedEpisodes = getPassedEpisodes(season);
      return passedEpisodes + number;
    }

    const nextEpisodeNumber = getNextEpisode();
    const nextEpisodePosition = nextEpisodeNumber
      ? ((nextEpisodeNumber - 1) / episodeCount) * 100
      : 0;

    return (
      <div className="absolute top-[0%] w-full bg-red-600 h-1">
        <div
          className="bg-gradient-to-r z-100 from-green-400 to-green-500 h-1 transition-all duration-500"
          style={{ width: `${(episodesWatched / episodeCount) * 100}%` }}
        />
        {nextEpisodeNumber && nextEpisodeNumber <= episodeCount && (
          <div
            className="absolute cursor-default z-50 top-0 bottom-0 bg-blue-500"
            style={{
              left: `${nextEpisodePosition}%`,
              zIndex: 10,
              width: `max(${1 / episodeCount * 100}%, 0.5rem)`,
            }}
            title={`Next: Episode ${nextEpisode}`}
          />
        )}
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col justify-start">
      {authStatus == 'authenticated' && <button
        onClick={saveItem}
        disabled={disabled}
        className={`
          absolute left-[75%] top-[8%] z-10
          bg-black/80 py-[3px] px-[5px] rounded-md
          enabled:hover:bg-black ${action == 'add' ? 'hover:text-green-400' : action == 'remove' ? 'hover:text-red-400' : ''}
          cursor-pointer
        `}
      >
        {action == 'add' ? <IoIosAdd className="my-[0.5]" /> : action == 'remove' ?
         <IoIosRemove className="my-[0.5]" /> : <IoIosHourglass className="my-[0.5]" />}
      </button>}
      {(nextEpisode || lastEpisode) && (
        <div
        className={`absolute left-[50%] text-center -translate-x-1/2 text-xs
                    py-[3px] px-[5px] w-full ${nextEpisode ? 'bg-green-800' : notEndedAndLast ? 'bg-orange-700' : 'bg-red-800'} rounded-t-md z-100`}>
          {nextEpisode ? nextEpisode : lastEpisode}
        </div>
        )}
      <Link href={`/show/${id}`} title={title} className="h-full">
        <div className="relative cursor-pointer flex flex-col h-full group">
          <div className="relative p-4 bg-slate-800 rounded-t-lg flex-1 min-h-[200px]">
            <Image
              alt={title}
              src={imageSmall ? imageSmall : image}
              unoptimized={imageSmall ? true : false}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="p-4 object-contain"
              loading="eager"
            />
          </div>

          <div className="relative bg-slate-700 p-2 text-center rounded-b-lg flex items-center justify-center text-gray-200 group-hover:text-emerald-400 group-hover:underline">
            <WatchedBanner />
            {`${title}${year ? ` (${year})` : ''}`}
          </div>
        </div>
      </Link>
    </div>
  );
}

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
  const [sortBy, setSortBy] = useState('date');

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
    if (sortBy == sortType) return;
    setSortBy(sortType);
  }

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
        <h2 className="text-2xl font-bold text-gray-100 flex-1">Saved Shows</h2>
        <div className="flex items-center gap-2">
          <div>Sort By:</div>
          <button onClick={() => handleSort('date')} disabled={sortBy == 'date'} title='Next Episode' className={sortButtonClass}><IoIosCalendar size={20} /></button>
          <button onClick={() => handleSort('status')} disabled={sortBy == 'status'} title='Watch Status' className={sortButtonClass}><IoIosCheckmarkCircleOutline size={20} /></button>
        </div>
      </div>
      {sortBy == 'date' ? shows.length > 0 ? (
        <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
          {shows.map((show) => {
            return <Item
                      key={`show-saved-${show.id}`}
                      authStatus={status} id={show.id}
                      showStatus={show.status}
                      title={show.title}
                      image={show.image}
                      episodeCount={show.episodeCount}
                      episodesWatched={show.episodesWatched}
                      seasonEpisodeCount={show.seasonEpisodeCount}
                      imageSmall={show.imageSmall}
                      nextEpisode={show.nextEpisode}
                      lastEpisode={show.lastEpisode}
                      releaseDate={show.releaseDate}
                      removeFromShows={removeFromShows}
                    />
          })}
        </div>) : (
          <div className="flex flex-1 justify-center items-center">
            <div className="text-gray-400">There are currently no shows saved.</div>
          </div>
        ) : shows.length > 1 ? (
          <div>
            <h2 className="text-xl mb-2 mx-4 font-bold text-gray-400 flex-1">In Progress</h2>
            <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
              {shows.filter((show) => show.category == 1).map((show) => {
                return <Item
                          key={`show-in-progress-${show.id}`}
                          authStatus={status} id={show.id}
                          showStatus={show.status}
                          title={show.title}
                          image={show.image}
                          episodeCount={show.episodeCount}
                          episodesWatched={show.episodesWatched}
                          seasonEpisodeCount={show.seasonEpisodeCount}
                          imageSmall={show.imageSmall}
                          nextEpisode={show.nextEpisode}
                          lastEpisode={show.lastEpisode}
                          releaseDate={show.releaseDate}
                          removeFromShows={removeFromShows}
                        />
              })}
           </div>
           <h2 className="text-xl mb-2 mx-4 font-bold text-gray-400 flex-1">Completed / Up-To-Date</h2>
            <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
              {shows.filter((show) => show.category == 2).map((show) => {
                return <Item
                          key={`show-unwatched-${show.id}`}
                          authStatus={status} id={show.id}
                          showStatus={show.status}
                          title={show.title}
                          image={show.image}
                          episodeCount={show.episodeCount}
                          episodesWatched={show.episodesWatched}
                          seasonEpisodeCount={show.seasonEpisodeCount}
                          imageSmall={show.imageSmall}
                          nextEpisode={show.nextEpisode}
                          lastEpisode={show.lastEpisode}
                          releaseDate={show.releaseDate}
                          removeFromShows={removeFromShows}
                        />
              })}
           </div>
           <h2 className="text-xl mb-2 mx-4 font-bold text-gray-400 flex-1">Unwatched</h2>
            <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
              {shows.filter((show) => show.category == 0).map((show) => {
                return <Item
                          key={`show-completed-${show.id}`}
                          authStatus={status} id={show.id}
                          showStatus={show.status}
                          title={show.title}
                          image={show.image}
                          episodeCount={show.episodeCount}
                          episodesWatched={show.episodesWatched}
                          seasonEpisodeCount={show.seasonEpisodeCount}
                          imageSmall={show.imageSmall}
                          nextEpisode={show.nextEpisode}
                          lastEpisode={show.lastEpisode}
                          releaseDate={show.releaseDate}
                          removeFromShows={removeFromShows}
                        />
              })}
           </div>
          </div>
        ) : (
          <div className="flex flex-1 justify-center items-center">
            <div className="text-gray-400">There are currently no shows saved.</div>
          </div>
        )}
    </>
  );
}