import { MovieWatchlist } from "@/utils/types";
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
  releaseDate?: string,
  status: 'unauthenticated' | 'authenticated' | 'loading';
  removeFromMovies: (id: string) => void;
}

function Item({ id, image, title, releaseDate, status, removeFromMovies }: ItemProps) {
  const [action, setAction] = useState('remove');
  const [disabled, setDisabled] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const year = releaseDate ? releaseDate.split('-', 1).at(0) : null;

  const saveItem = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const prevAction = action;
    setDisabled(true);
    setAction('loading');
    
    fetch(`/api/movie/save`, {
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
          removeFromMovies(id);
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
  
  return (
    <div className="relative flex h-full flex-col justify-start">
      {status == 'authenticated' && <button
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
      <Link href={`/movie/${id}`} title={title} className="h-full">
        <div className="relative cursor-pointer flex flex-col h-full group">
          <div className="relative p-4 bg-slate-800 rounded-t-lg flex-1 min-h-[200px]">
            <Image
              alt={title}
              src={image}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="p-4 object-contain"
              loading="eager"
            />
          </div>

          <div className="bg-slate-700 p-2 text-center rounded-b-lg flex items-center justify-center text-gray-200 group-hover:text-emerald-400 group-hover:underline">
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
      <title>Saved Movies | TV Tracker</title>
    </Head>
  )
}

export default function Movies() {
  const router = useRouter();
  const { data: _, status } = useSession();
  const [movies, setMovies] = useState<MovieWatchlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState('date');

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
        <h2 className="text-2xl font-bold text-gray-100 flex-1">Saved Movies</h2>
        <div className="flex items-center gap-2">
          <div>Sort By:</div>
          <button onClick={() => handleSort('date')} disabled={sortBy == 'date'} title='Release Date' className={sortButtonClass}><IoIosCalendar size={20} /></button>
          <button onClick={() => handleSort('status')} disabled={sortBy == 'status'} title='Watch Status' className={sortButtonClass}><IoIosCheckmarkCircleOutline size={20} /></button>
        </div>
      </div>
      {sortBy == 'date' ? movies.length > 0 ? (
        <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
          {movies.map((movie) => {
            return <Item 
                      key={`movie-saved-${movie.id}`} 
                      status={status} id={movie.id} 
                      title={movie.title} 
                      image={movie.image} 
                      releaseDate={movie.releaseDate}
                      removeFromMovies={removeFromMovies}
                    />
          })}
        </div>) : (
          <div className="flex flex-1 justify-center items-center">
            <div className="text-gray-400">There are currently no movies saved.</div>
          </div>
        ) : movies.length > 0 ? (
          <div>
            <h2 className="text-xl mb-2 mx-4 font-bold text-gray-400 flex-1">Unwatched</h2>
            <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
              {movies.filter(movie => !movie.watched).map((movie) => {
                return <Item 
                          key={`movie-saved-${movie.id}`} 
                          status={status} id={movie.id} 
                          title={movie.title} 
                          image={movie.image} 
                          releaseDate={movie.releaseDate}
                          removeFromMovies={removeFromMovies}
                        />
              })}
           </div>
           <h2 className="text-xl mb-2 mx-4 font-bold text-gray-400 flex-1">Watched</h2>
            <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
              {movies.filter(movie => movie.watched).map((movie) => {
                return <Item 
                          key={`movie-saved-${movie.id}`} 
                          status={status} id={movie.id} 
                          title={movie.title} 
                          image={movie.image} 
                          releaseDate={movie.releaseDate}
                          removeFromMovies={removeFromMovies}
                        />
              })}
           </div>
          </div>
        ) : (
          <div className="flex flex-1 justify-center items-center">
            <div className="text-gray-400">There are currently no movies saved.</div>
          </div>
        )}
    </>
  );
}