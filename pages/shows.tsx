import { IShow } from "@/utils/types";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { IoIosAdd, IoIosHourglass, IoIosRemove } from "react-icons/io";

interface ItemProps {
  id: string,
  title: string,
  image: string,
  releaseDate?: string,
  status: 'unauthenticated' | 'authenticated' | 'loading';
  removeFromShows: (id: string) => void;
}

function Item({ id, image, title, releaseDate, status, removeFromShows }: ItemProps) {
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
  
  return (
    <div className="relative flex h-full flex-col justify-start">
      {status == 'authenticated' && <button
        onClick={saveItem}
        disabled={disabled}
        className={`
          absolute left-[75%] top-[8%] z-10
          bg-slate-500 py-[3px] px-[5px] rounded-md
          enabled:hover:bg-slate-600 ${action == 'add' ? 'hover:text-green-400' : action == 'remove' ? 'hover:text-red-400' : ''}
          cursor-pointer
        `}
      >
        {action == 'add' ? <IoIosAdd className="my-[0.5]" /> : action == 'remove' ?
         <IoIosRemove className="my-[0.5]" /> : <IoIosHourglass className="my-[0.5]" />}
      </button>}
      <Link href={`/show/${id}`} title={title} className="h-full">
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
      <title>Saved Shows | TV Tracker</title>
    </Head>
  )
}

export default function Shows() {
  const router = useRouter();
  const { data: _, status } = useSession();
  const [shows, setShows] = useState<IShow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status == 'loading') return;
    if (status == 'unauthenticated') {
      router.push('/');
      return;
    }
    fetchSavedShows();
  }, [status])

  const fetchSavedShows = async () => {
    setError('');
    setLoading(true);

    fetch(`/api/show/watchlist`).then(res => res.json()).then(data => {
      if (data.success) {
        setShows(data.shows);
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

  return (
    <>
      <Title />
      <h2 className="text-2xl font-bold text-gray-100 mb-2 ml-4">Saved Shows</h2>
      {shows.length > 0 ? (
        <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
          {shows.map((show) => {
            return <Item 
                      key={`show-saved-${show.id}`}
                      status={status} id={show.id}
                      title={show.title}
                      image={show.image}
                      releaseDate={show.releaseDate}
                      removeFromShows={removeFromShows}
                    />
          })}
        </div>) : (
          <div className="flex flex-1 justify-center items-center">
            <div className="text-gray-400">There are currently no shows saved.</div>
          </div>
        )}
    </>
  );
}