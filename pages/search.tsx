import Item from "@/components/Item";
import { ItemProps } from "@/utils/types";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

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
            return <Item
                      key={`movie-item-${movie.id}`}
                      id={movie.id}
                      title={movie.title}
                      image={movie.image}
                      releaseDate={movie.releaseDate}
                      saved={movie.saved}
                      type={'movie'}
                    />
          }) : <Loading inline />}
        </div>
        <h2 className="text-2xl font-bold text-gray-100 mb-2 ml-4">TV Shows</h2>
        <div className="grid items-stretch grid-cols-[repeat(auto-fill,_minmax(170px,_1fr))] gap-4 m-4">
          {shows != null ? shows.map((show) => {
            return <Item
                      key={`show-item-${show.id}`}
                      id={show.id}
                      title={show.title}
                      image={show.image}
                      releaseDate={show.releaseDate}
                      saved={show.saved}
                      type={'show'}
                    />
          }) : <Loading inline />}
        </div>
      </div>
    </>
  )
}