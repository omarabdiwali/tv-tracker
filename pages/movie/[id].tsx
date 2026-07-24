import MovieDetails from "@/components/MovieDetails";
import { MovieProps } from "@/utils/types";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Details() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [movie, setMovie] = useState<MovieProps | null>(null);
  
  useEffect(() => {
    if (id) {
      fetchData(id as string);
    }
  }, [id])

  const fetchData = async (movieId: string) => {
    setLoading(true);
    setError('');

    fetch(`/api/movie/details?id=${movieId}`).then(res => res.json()).then(data => {
      if (data.success) {
        setMovie(data.movie);
      } else {
        setError(data.message);
      }
    }).catch(err => {
      console.log(err);
      setError(err.message);
    }).finally(() => {
      setLoading(false);
    })
  }

  function Title() {
    return (
      <Head>
        <title>{movie ? `${movie.title} | TV Tracker` : 'TV Tracker'}</title>
      </Head>
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

  if (error) {
    return (
      <>
        <Title />
        <div>{error}</div>
      </>
    )
  }
  
  return (
    <>
      <Title />
      {movie && <MovieDetails movie={movie} />}
    </>
  );
}