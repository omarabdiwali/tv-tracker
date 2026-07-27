import { signIn } from "next-auth/react";
import { 
  IoIosCheckmarkCircle, 
  IoIosFilm, 
  IoIosList, 
  IoIosStats, 
} from "react-icons/io";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <IoIosFilm className="text-base" /> TV Tracker
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Never lose track of what you&apos;re watching again.
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal">
            Track your favorite TV shows down to the exact episode, manage your movie watchlists, and see what&apos;s airing next - all in one place.
          </p>

          <button
            onClick={() => signIn("google")}
            className="group relative px-8 py-4 cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/50 rounded-2xl transition-all duration-300 ease-out hover:shadow-[0_0_2rem_-0.5rem_#06b6d4] active:scale-95"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 flex items-center gap-3 font-semibold text-slate-200 group-hover:text-white">
              {/* Inline SVG for Google logo for a cleaner button look */}
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </span>
          </button>
        </div>

      </section>

      {/* Feature Grid */}
      <section id="features" className="py-16 bg-slate-950/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white">Designed for Binge Watchers</h2>
            <p className="text-slate-400 mt-2">Everything you need to keep your watching schedule organized effortlessly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl mb-4">
                <IoIosStats />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Episode-Level Progress</h3>
              <p className="text-sm text-slate-300">
                Mark individual episodes as watched, view progress bars per season, or complete entire seasons with a single click.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl mb-4">
                <IoIosList />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Smart Sorting & Filters</h3>
              <p className="text-sm text-slate-300">
                Organize your watchlist by next episode release date, watch status (In Progress, Completed, Unwatched), or movie release dates.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl mb-4">
                <IoIosCheckmarkCircle />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Rich Movie & Show Details</h3>
              <p className="text-sm text-slate-300">
                Access powered metadata from TMDB & TVMaze including ratings, runtimes, upcoming release dates, trailers, and IMDb links.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="py-16 px-4 max-w-5xl mx-auto w-full text-center">
        <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-800/90 border border-slate-700 p-8 sm:p-12 rounded-2xl relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Ready to organize your watchlists?</h2>
            <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
              Sign in with your account to start saving TV shows and movies immediately.
            </p>
            <div className="pt-2">
              <button
                onClick={() => signIn('google')}
                className="px-8 py-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-base transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Sign In Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800 text-center text-slate-500 text-xs">
        <p>© {new Date().getFullYear()} TV Tracker. Powered by TMDB & TVMaze.</p>
      </footer>
    </div>
  );
}