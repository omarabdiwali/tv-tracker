import { ItemProps } from "@/utils/types";
import Image from "next/image";
import Link from "next/link";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { IoIosAdd, IoIosHourglass, IoIosRemove } from "react-icons/io";

const getYear = (releaseDate: string | undefined | null) => {
  if (!releaseDate) return null;
  let year: string | null | undefined = releaseDate.split('-', 1).at(0);
  if (year == null || isNaN(Number(year))) {
    year = null;
  }

  return year;
}

export default function Item({ id, image, title, releaseDate, type, saved, removeFromMovies, showReleaseDate=false }: ItemProps) {
  const [action, setAction] = useState(saved ? 'remove' : 'add');
  const [disabled, setDisabled] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const year = getYear(releaseDate);

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
      body: JSON.stringify({ id: `${id}`, title, save: prevAction == 'add' })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        setAction(prevAction == 'add' ? 'remove' : 'add');
        enqueueSnackbar(data.message, { variant: "success", autoHideDuration: 1500 });
        if (removeFromMovies && prevAction == 'remove') {
          removeFromMovies(id);
        }
      } else {
        if (data.message == 'Unauthenticated user.') {
          window.location.href = '/';
          return;
        } else {
          enqueueSnackbar(data.message, { variant: "error", autoHideDuration: 1500 });
          setAction(prevAction);
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
      {showReleaseDate && releaseDate && <div className="absolute left-[50%] top-[2%] -translate-x-1/2 bg-black/80 text-xs py-[3px] px-[5px] rounded-lg z-100">{releaseDate}</div>}
      <Link href={`/${type}/${id}`} title={title} className="h-full">
        <div className="relative cursor-pointer flex flex-col h-full group">
          <div className="relative p-3 bg-slate-800 rounded-t-lg flex-1 min-h-[200px]">
            <Image
              unoptimized
              alt={title}
              src={image}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="p-3 object-contain"
              loading="eager"
            />
          </div>

          <div className="bg-slate-700 text-sm p-2 text-center rounded-b-lg flex items-center justify-center text-gray-200 group-hover:text-emerald-400 group-hover:underline">
            {`${title}${year ? ` (${year})` : ''}`}
          </div>
        </div>
      </Link>
    </div>
  );
}
