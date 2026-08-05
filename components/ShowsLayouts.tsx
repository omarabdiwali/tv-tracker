import { SeasonEpisodeCountType, ShowWatchlist } from "@/utils/types";
import Image from "next/image";
import Link from "next/link";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { IoIosAdd, IoIosHourglass, IoIosRemove } from "react-icons/io";
import { Fragment } from "react/jsx-runtime";

const now = new Date();
const inAWeek = new Date().setDate(now.getDate() + 8);
const inAMonth = new Date().setMonth(now.getMonth() + 1) + 86400000;

const dateSections = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'future', label: 'Future' },
  { key: 'others', label: 'Others' },
] as const;

const statusSections = [
  { key: 1, label: 'In Progress' },
  { key: 2, label: 'Completed / Up-To-Date' },
  { key: 0, label: 'Unwatched' }
] as const;

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

const parseAirDate = (str: string | null | undefined) => {
  if (!str) return null;
  const strd = str.slice(str.indexOf('/') + 2)
  const d = new Date(strd);
  return isNaN(d.getTime()) ? null : d.getTime();
}

interface ItemProps {
  id: string,
  title: string,
  image: string,
  imageSmall?: string,
  nextEpisode: string | undefined | null,
  lastEpisode: string | undefined | null,
  releaseDate?: string,
  showStatus: string,
  removeFromShows: (id: string) => void;
  episodeCount?: number,
  episodesWatched?: number,
  seasonEpisodeCount?: SeasonEpisodeCountType
}

function Item({ id, image, imageSmall, title, releaseDate, episodeCount, episodesWatched,
  seasonEpisodeCount, nextEpisode, lastEpisode, showStatus, removeFromShows }: ItemProps) {
  const [action, setAction] = useState('remove');
  const [disabled, setDisabled] = useState(false);
  const [imgSrc, setImgSrc] = useState(imageSmall || image || 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png');

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
      body: JSON.stringify({ id: `${id}`, title, save: prevAction == 'add' })
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

  const WatchedProgress = () => {
    if (episodeCount == 0 || episodeCount == undefined || episodeCount == null || episodesWatched == undefined || episodesWatched == null) {
      return <div className="absolute bottom-[0%] w-full bg-red-600 h-1" />;
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
    const totalEpisodeCount = Math.max(nextEpisodeNumber || -1, episodeCount);
    const nextEpisodePosition = nextEpisodeNumber
      ? ((nextEpisodeNumber - 1) / totalEpisodeCount) * 100
      : 0;

    return (
      <div className="absolute flex bottom-[0%] w-full bg-red-600 h-1">
        <div
          className="bg-gradient-to-r z-100 from-green-400 to-green-500 h-1 transition-all duration-500"
          style={{ width: `${(episodesWatched / totalEpisodeCount) * 100}%` }}
        />
        {nextEpisodeNumber && nextEpisodeNumber > episodesWatched && nextEpisodeNumber <= totalEpisodeCount && (
          <div
            className="absolute bottom-[0%] h-full cursor-default z-50 bg-blue-500"
            style={{
              left: `${nextEpisodePosition}%`,
              width: `${1 / totalEpisodeCount * 100}%`,
            }}
            title={`Next: Episode ${nextEpisode}`}
          />
        )}
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col justify-start">
      <button
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
      </button>
      {(nextEpisode || lastEpisode) && (
        <div
        className={`absolute left-[50%] text-center -translate-x-1/2 text-xs border-t border-x border-slate-800
                    py-[3px] px-[5px] w-full bg-black ${nextEpisode ? 'text-green-600' : notEndedAndLast ? 'text-orange-500' : 'text-red-700'} rounded-t-md z-100`}>
          {nextEpisode ? nextEpisode : lastEpisode}
        </div>
        )}
      <Link href={`/show/${id}`} title={title} className="h-full">
        <div className="relative cursor-pointer flex flex-col h-full group">
          <div className="relative bg-slate-800 rounded-t-lg flex-1 min-h-[200px]">
            <WatchedProgress />
            <Image
              alt={title}
              src={imgSrc}
              unoptimized={imageSmall || imgSrc == 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png' ? true : false}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="p-3 object-contain"
              loading="eager"
              onError={() => setImgSrc('https://static.tvmaze.com/images/no-img/no-img-portrait-text.png')}
            />
          </div>

          <div className="relative text-sm wrap-anywhere bg-slate-700 p-2 text-center rounded-b-lg flex items-center justify-center text-gray-200 group-hover:text-emerald-400 group-hover:underline">
            {`${title}${year ? ` (${year})` : ''}`}
          </div>
        </div>
      </Link>
    </div>
  );
}

export function DateLayout({ groups, removeFromShows } : { groups: Record<string, ShowWatchlist[]>, removeFromShows: (id: string) => void }) {
  return(
    <div>
      {dateSections.map(({ key, label }) => (
        groups[key]?.length && (
          <Fragment key={key}>
            <h2 className="text-xl mb-2 mx-4 font-bold text-gray-400">{label}</h2>
            <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
              {groups[key].map((show: ShowWatchlist) => (
                <Item
                  key={show.id}
                  id={show.id}
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
              ))}
            </div>
          </Fragment>
        )
      ))}
    </div>
  )
}

export function AlphaLayout({ shows, removeFromShows } : { shows: ShowWatchlist[], removeFromShows: (id: string) => void }) {
  return (
    <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
      {shows.map((show) => {
        return <Item
                  key={`show-saved-${show.id}`}
                  id={show.id}
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
  )
}

export function StatusLayout({ groups, removeFromShows } : 
  { groups: Record<string, ShowWatchlist[]>, removeFromShows: (id: string) => void }) {
  return(
    <div>
      {statusSections.map(({ key, label }) => (
        groups[key]?.length && (
          <Fragment key={key}>
            <h2 className="text-xl mb-2 mx-4 font-bold text-gray-400">{label}</h2>
            <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
              {groups[key].map((show: ShowWatchlist) => (
                <Item
                  key={show.id}
                  id={show.id}
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
              ))}
            </div>
          </Fragment>
        )
      ))}
    </div>
  )
}

export function RatingsLayout({ groups, removeFromShows } : 
  { groups: Record<string, ShowWatchlist[]>, removeFromShows: (id: string) => void }) {
  return(
    <div>
      {ratingsSections.map(({ key, label }) => (
        groups[key]?.length && (
          <Fragment key={key}>
            <h2 className="text-xl mb-2 mx-4 font-bold text-gray-400">{label}</h2>
            <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
              {groups[key].map((show: ShowWatchlist) => (
                <Item
                  key={show.id}
                  id={show.id}
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
              ))}
            </div>
          </Fragment>
        )
      ))}
    </div>
  )
}

export function groupByDate(shows: ShowWatchlist[]) {
  return shows.reduce((acc: Record<string, ShowWatchlist[]>, show) => {
    const airdate = parseAirDate(show.nextEpisode);
    let key = 'others';
    if (airdate !== null) {
      if (airdate < inAWeek) key = 'week';
      else if (airdate < inAMonth) key = 'month';
      else key = 'future';
    }
    (acc[key] ??= []).push(show);
    return acc;
  }, {});
}

export function sortByAlpha(shows: ShowWatchlist[]) {
  return shows.toSorted((a, b) => a.title.localeCompare(b.title));
}

export function groupByStatus(shows: ShowWatchlist[]) {
  return shows.reduce((acc: Record<string, ShowWatchlist[]>, show) => {
    (acc[show.category] ??= []).push(show);
    return acc;
  }, {});
}

export function groupByRatings(shows: ShowWatchlist[]) {
  return shows.reduce((acc: Record<string, ShowWatchlist[]>, show) => {
    const rating = (show.rating || 0) * 2;
    (acc[rating] ??= []).push(show);
    return acc;
  }, {});
}