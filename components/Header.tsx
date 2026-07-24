import { useRef, useState } from "react";
import { useRouter } from "next/router";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { IoIosFilm, IoIosHome, IoIosTv } from "react-icons/io";
import { BiSolidCameraMovie } from "react-icons/bi";

export function Header() {
  const { data: _, status } = useSession();
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  const redirect = (href: string) => {
    setSearch("");
    inputRef.current?.blur();
    router.push(href);
  };

  if (status === "loading") return null; // or a skeleton/spinner

  return (
    <>
      {status === "authenticated" ? (
        <div className="m-4 gap-2 flex justify-center items-center">
          <button onClick={() => redirect("/")} title={"Home"} className="py-3 px-4 cursor-pointer hover:bg-slate-800 bg-[var(--input-bg)] rounded-lg">
            <IoIosHome size={20} />
          </button>
          <button onClick={() => redirect("/movies")} title={"Saved Movies"} className="py-3 px-4 cursor-pointer hover:bg-slate-800 bg-[var(--input-bg)] rounded-lg">
            <BiSolidCameraMovie size={20} />
          </button>
          <button onClick={() => redirect("/shows")} title={"Saved Shows"} className="py-3 px-4 cursor-pointer hover:bg-slate-800 bg-[var(--input-bg)] rounded-lg">
            <IoIosTv size={20} />
          </button>
          <form onSubmit={handleSubmit} className="flex flex-1 gap-2">
            <input
              ref={inputRef}
              onChange={(e) => setSearch(e.target.value)}
              value={search}
              placeholder="Search Movies and TV Shows..."
              className="flex-1 bg-[var(--input-bg)] text-gray-200 placeholder-gray-400 p-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            <button type="button" onClick={handleSignOut} className="bg-orange-400 hover:bg-orange-300 text-black p-2 cursor-pointer rounded-lg transition-colors font-medium">
              Sign Out
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-row m-6">
          <Link href={'/'}>
            <div className="text-2xl cursor-pointer hover:text-gray-400">TV Tracker</div>
          </Link>
          <button className="m-4 my-auto p-2 ml-auto rounded-lg hover:bg-slate-600 bg-slate-500 cursor-pointer" onClick={() => signIn("google")}>
            Sign in with Google
          </button>
        </div>
      )}
    </>
  );
}