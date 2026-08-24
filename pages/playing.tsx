import Item from "@/components/Item";
import { ItemProps } from "@/utils/types";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

function Title() {
  return (
    <Head>
      <title>Now Playing | TV Tracker</title>
    </Head>
  )
}

export default function Movies() {
  const router = useRouter();
  const { data: _, status } = useSession();
  const [movies, setMovies] = useState<ItemProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sortMovies = (a: ItemProps, b: ItemProps) => {
    if (!a.releaseDate && !b.releaseDate) return 0;
    if (!a.releaseDate && b.releaseDate) return 1;
    if (a.releaseDate && !b.releaseDate) return -1;

    const aTime = new Date(a.releaseDate as string).getTime();
    const bTime = new Date(b.releaseDate as string).getTime();
    return aTime - bTime;
  }

  useEffect(() => {
    if (status == 'loading') return;
    if (status == 'unauthenticated') {
      router.push('/');
      return;
    }
    fetchUpcomingMovies();
  }, [status])

  const fetchUpcomingMovies = async () => {
    setError('');
    setLoading(true);

    fetch(`/api/movie/playing`).then(res => res.json()).then(data => {
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

  return (
    <>
      <Title />
      <h2 className="text-2xl font-bold text-gray-100 mb-2 ml-4">Now Playing</h2>
      {movies && movies.length > 0 ? (
        <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
          {movies.map((movie) => {
            return <Item
                      key={`movie-saved-${movie.id}`}
                      id={movie.id}
                      title={movie.title}
                      image={movie.image}
                      releaseDate={movie.releaseDate}
                      saved={movie.saved}
                      watched={movie.watched}
                      type={'movie'}
                      showReleaseDate
                    />
          })}
        </div>) : (
          <div className="flex flex-1 justify-center items-center">
            <div className="text-gray-400">There are currently no movies saved.</div>
          </div>
        )}
    </>
  );
}