import { useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { IoIosAdd, IoIosHourglass, IoIosRemove } from "react-icons/io";

interface ItemProps {
  id: string | number,
  name: string,
  image: string,
  year?: string,
  type: string,
  isSaved: boolean,
  status: 'unauthenticated' | 'authenticated' | 'loading'
}

function Item({ id, name, image, type, status, isSaved }: ItemProps) {
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
      body: JSON.stringify({ id: `${id}`, title: name, save: prevAction == 'add' })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        setAction(prevAction == 'add' ? 'remove' : 'add');
        enqueueSnackbar(data.message, { variant: "success", autoHideDuration: 1500 });
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
      <Link href={`/${type}/${id}`} title={name} className="h-full">
        <div className="relative cursor-pointer flex flex-col h-full group">
          <div className="relative p-4 bg-slate-800 rounded-t-lg flex-1 min-h-[200px]">
            <Image
              unoptimized
              alt={name}
              src={image}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="p-4 object-contain"
              loading="eager"
            />
          </div>

          <div className="bg-slate-700 p-2 text-center rounded-b-lg flex items-center justify-center text-gray-200 group-hover:text-emerald-400 group-hover:underline">
            {name}
          </div>
        </div>
      </Link>
    </div>
  );
}

function Title() {
  return (
    <Head>
      <title>TV Tracker</title>
    </Head>
  )
}

export default function Home() {
  const { data: _, status } = useSession();
  const [trending, setTrending] = useState<ItemProps[]>([]);
  const [trending1, setTrending1] = useState<ItemProps[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTrendingMovies(1);
    fetchTrendingMovies(2);
  }, [])

  const fetchTrendingMovies = async (page: number) => {
    fetch(`/api/movie/trending?page=${page}`).then(res => res.json()).then(data => {
      if (data.success) {
        page == 1 ? setTrending(data.movies) : setTrending1(data.movies);
      } else {
        setError(data.message);
      }
    }).catch(err => {
      console.error(err);
      setError(err.message);
    })
  }

  const concatMovies = (a: ItemProps[], b: ItemProps[]) : ItemProps[] => {
    const unique = new Set();
    const combination = [];
    
    for (const movie of a) {
      if (unique.has(movie.id)) continue;
      unique.add(movie.id);
      combination.push(movie);
    }

    for (const movie of b) {
      if (unique.has(movie.id)) continue;
      unique.add(movie.id);
      combination.push(movie);
    }

    return combination;
  }

  if (error) {
    return (
      <>
        <Title />
        <div>{error}</div>
      </>
    )
  }

  if (trending.length == 0 && trending1.length == 0) {
    return (
      <>
        <Title />
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="w-12 h-12 border-4 border-[#001f3f] border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    )
  }

  return (
    <>
      <Title />
      <h2 className="text-2xl font-bold text-gray-100 mb-2 ml-4">Trending Movies</h2>
      <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
        {concatMovies(trending, trending1).map((movie) => {
          return <Item key={`movie-trending-${movie.id}`} status={status} id={movie.id} name={movie.name} image={movie.image} isSaved={movie.isSaved} type={'movie'} />
        })}
      </div>
    </>
  );
}