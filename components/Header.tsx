import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { IoIosFilm, IoIosHome, IoIosTv } from "react-icons/io";
import { BiSolidCameraMovie } from "react-icons/bi";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoLogOut } from "react-icons/io5";

export function Header() {
  const { data: _, status } = useSession();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    setPage(router.pathname)
  }, [router.isReady, router.pathname])

  const handleSignOut = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    signOut();
  }

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!search.trim()) return;
    router.push(`/search?q=${encodeURIComponent(search.trim())}`);
    inputRef.current?.blur();
    setSearch("");
  };

  const eraseSearch = () => {
    setSearch("");
    inputRef.current?.blur();
  };

  if (status != "authenticated") return null;

  return (
    <header className="px-0 py-3 mx-4">
      {status === "authenticated" && (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
          <div className="flex flex-wrap gap-2 justify-center sm:justify-center">
            <Link href={'/'} onClick={eraseSearch}>
              <button
                title={"Home"}
                disabled={page == '/'}
                className={`p-2 sm:p-3 ${page != '/' ? 'cursor-pointer hover:bg-slate-800' : 'opacity-60'} bg-[var(--input-bg)] rounded-lg transition-colors flex-shrink-0`}
              >
                <IoIosHome size={20} />
              </button>
            </Link>
            <Link href={'/movies'} onClick={eraseSearch}>
              <button
                title={"Saved Movies"}
                disabled={page == '/movies'}
                className={`p-2 sm:p-3 ${page != '/movies' ? 'cursor-pointer hover:bg-slate-800' : 'opacity-60'} bg-[var(--input-bg)] rounded-lg transition-colors flex-shrink-0`}
              >
                <BiSolidCameraMovie size={20} />
              </button>
            </Link>
            <Link href={'/shows'} onClick={eraseSearch}>
              <button
                title={"Saved Shows"}
                disabled={page == '/shows'}
                className={`p-2 sm:p-3 ${page != '/shows' ? 'cursor-pointer hover:bg-slate-800' : 'opacity-60'} bg-[var(--input-bg)] rounded-lg transition-colors flex-shrink-0`}
              >
                <IoIosTv size={20} />
              </button>
            </Link>
            <Link href={'/playing'} onClick={eraseSearch}>
              <button
                title={"Now Playing"}
                disabled={page == '/playing'}
                className={`p-2 sm:p-3 ${page != '/playing' ? 'cursor-pointer hover:bg-slate-800' : 'opacity-60'} bg-[var(--input-bg)] rounded-lg transition-colors flex-shrink-0`}
              >
                <IoIosFilm size={20} />
              </button>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              className="block sm:hidden p-2 sm:p-3 cursor-pointer bg-mist-800 hover:bg-mist-700 rounded-lg transition-colors flex-shrink-0"
            >
              <IoLogOut size={20} />
            </button>
          </div>

        <form onSubmit={handleSubmit} className="flex flex-1 w-full sm:w-auto min-w-0 gap-2">
          <input
            ref={inputRef}
            onChange={(e) => setSearch(e.target.value)}
            value={search}
            placeholder="Search..."
            className="flex-1 min-w-0 bg-[var(--input-bg)] text-gray-200 placeholder-gray-400 px-3 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
          />
          <button
            type="submit"
            title="Search"
            className="py-2 px-3 sm:px-[14px] sm:py-3 cursor-pointer hover:bg-slate-900 bg-slate-800 rounded-full transition-colors flex-shrink-0"
          >
            <FaMagnifyingGlass size={16} />
          </button>
        </form>
        <button
          type="button"
          onClick={handleSignOut}
          title="Sign Out"
          className="hidden sm:block p-2 sm:p-3 cursor-pointer bg-mist-800 hover:bg-mist-700 rounded-lg transition-colors flex-shrink-0"
        >
          <IoLogOut size={20} />
        </button>
      </div>)}
    </header>
  );
}