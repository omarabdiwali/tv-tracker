import Item from "@/components/Item";
import LandingPage from "@/components/LandingPage";
import { ItemProps } from "@/utils/types";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useEffect, useState } from "react";

function Title() {
  return (
    <Head>
      <title>TV Tracker</title>
    </Head>
  )
}

export default function Home() {
  const { status } = useSession();
  const [trending, setTrending] = useState<ItemProps[]>([]);
  const [trending1, setTrending1] = useState<ItemProps[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTrendingMovies(1);
      fetchTrendingMovies(2);
    }
  }, [status]);

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

  if (status === 'unauthenticated') {
    return (
      <>
        <LandingPage />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Title />
        <div>{error}</div>
      </>
    )
  }

  if (status === 'loading' || (trending.length == 0 && trending1.length == 0)) {
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
          return <Item 
                    key={`movie-trending-${movie.id}`}
                    id={movie.id} title={movie.title}
                    image={movie.image}
                    saved={movie.saved}
                    watched={movie.watched}
                    type={'movie'}
                  />
        })}
      </div>
    </>
  );
}