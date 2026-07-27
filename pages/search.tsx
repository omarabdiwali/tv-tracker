import { useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import { IoIosAdd, IoIosHourglass, IoIosRemove } from "react-icons/io";

interface ItemProps {
  id: string | number,
  year: string,
  name: string,
  image: string,
  isSaved: boolean,
  type: string | undefined
}

function Item({ id, name, image, year, isSaved, type }: ItemProps) {
  const [action, setAction] = useState(isSaved ? 'remove' : 'add');
  const [disabled, setDisabled] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const saveItem = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();

    const prevAction = action;
    setDisabled(true);
    setAction('loading');

    fetch(`/api/${type}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: `${id}`, title: name, save: action == 'add' })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        setAction(prevAction == 'add' ? 'remove' : 'add');
        enqueueSnackbar(data.message, { variant: 'success', autoHideDuration: 1500 });
      } else {
        if (data.message == 'Unauthenticated user.') {
          window.location.href = '/';
          return;
        } else {
          setAction(prevAction);
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
      <Link href={`/${type}/${id}`} title={name} className="h-full">
        <div className="relative cursor-pointer flex flex-col h-full group">
          <div className="relative p-3 bg-slate-800 rounded-t-lg flex-1 min-h-[200px]">
            <Image
              unoptimized
              alt={name}
              src={image}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="p-3 object-contain h-auto w-auto"
              loading="eager"
            />
          </div>

          <div className="bg-slate-700 text-sm p-2 text-center rounded-b-lg flex items-center justify-center text-gray-200 group-hover:text-emerald-400 group-hover:underline">
            {`${name}${year ? ` (${year})` : ''}`}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function Search() {
  const router = useRouter();
  const { q: query } = router.query;
  const { data: _, status } = useSession();

  const [shows, setShows] = useState<ItemProps[] | null>(null);
  const [movies, setMovies] = useState<ItemProps[] | null>(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status == "loading") return;
    if (status == 'unauthenticated') {
      router.push('/');
      return;
    }

    if (query) {
      setSearchQuery(query as string);
      setMovies(null);
      setShows(null);
      setError("");

      fetchTvSearch(query as string);
      fetchMovieSearch(query as string);
    }
  }, [query, status])

  const fetchTvSearch = async (queryString: string) => {
    fetch(`/api/show/search?q=${queryString}`)
      .then(res => res.json()).then(data => {
        if (data.success) {
          setShows(data.shows);
        } else {
          setError(data.message);
          setShows([]);
        }
      }).catch(err => {
        console.error(err);
        setError(err.message);
        setShows([]);
      })
  }

  const fetchMovieSearch = async (queryString: string) => {
    fetch(`/api/movie/search?q=${queryString}`)
      .then(res => res.json()).then(data => {
        if (data.success) {
          setMovies(data.movies);
        } else {
          setError(data.message);
          setMovies([]);
        }
      }).catch(err => {
        console.error(err);
        setError(err.message);
        setMovies([]);
      })
  }

  function Title() {
    return (
      <Head>
        <title>{query ? `Search: ${query} | TV Tracker` : 'Search | TV Tracker'}</title>
      </Head>
    )
  }

  function Loading({ inline = false }) {
    const className = inline 
      ? "flex items-center justify-center py-8" 
      : "fixed inset-0 flex items-center justify-center bg-black/30 z-50";
    return (
      <div className={className}>
        <div className="w-12 h-12 border-4 border-[#001f3f] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (status != 'authenticated') return null;

  if (shows == null && movies == null) {
    return (
      <>
        <Title />
        <Loading />
      </>
    )
  }

  if (error) {
    return (
      <>
        <Title />
        <div className="text-red-400 m-4">{error}</div>
      </>
    )
  }

  return (
    <>
      <Title />
      <div>
        {searchQuery.length && <h1 className="text-2xl font-bold text-gray-500 text-center mb-4 mt-2">{`Search Result(s) for '${searchQuery}'`}</h1>}
        <h2 className="text-2xl font-bold text-gray-100 mb-2 ml-4">Movies</h2>
        <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
          {movies != null ? movies.map((movie) => {
            return <Item key={`movie-item-${movie.id}`} id={movie.id} name={movie.name} image={movie.image} year={movie.year} isSaved={movie.isSaved} type={'movie'} />
          }) : <Loading inline />}
        </div>
        <h2 className="text-2xl font-bold text-gray-100 mb-2 ml-4">TV Shows</h2>
        <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
          {shows != null ? shows.map((show) => {
            return <Item key={`show-item-${show.id}`} id={show.id} name={show.name} image={show.image} year={show.year} isSaved={show.isSaved} type={'show'} />
          }) : <Loading inline />}
        </div>
      </div>
    </>
  )
}