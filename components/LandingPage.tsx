import { signIn } from "next-auth/react";
import Image from "next/image";
import {
  IoCheckmarkDoneCircle,
  IoSearch,
  IoList,
  IoStar,
} from "react-icons/io5";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-300 selection:bg-emerald-500/30 font-sans">
      
      <nav className="border-b border-slate-800/60 bg-[#0B1120]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-white tracking-tight">
            <span className="bg-emerald-500 text-slate-900 p-1 rounded-md">TV</span>
            Tracker
          </div>
          <button
            onClick={() => signIn("google")}
            className="text-sm font-semibold cursor-pointer text-slate-200 hover:text-white transition-colors"
          >
            Sign In
          </button>
        </div>
      </nav>

      <header className="relative pt-20 pb-24 lg:pt-32 lg:pb-40 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            Track every episode. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
              Never lose your place.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Your personal command center for TV shows and movies. Monitor your binge-watching progress, manage watchlists, and see what&apos;s airing next.
          </p>
          
          <button
            onClick={() => signIn("google")}
            className="inline-flex cursor-pointer items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-200 hover:scale-105 transition-all duration-200 shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="max-w-6xl mx-auto mt-16 px-4 sm:px-6 relative z-10">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-2 shadow-2xl backdrop-blur-sm transform -rotate-1 hover:rotate-0 transition-transform duration-500">
            <Image
              src="/images/watchlist.png" 
              alt="TV Tracker Dashboard showing saved shows" 
              width={0}
              height={0}
              sizes="100%"
              loading="eager"
              className="rounded-lg w-full h-auto object-cover border border-slate-700 shadow-inner"
            />
          </div>
        </div>
      </header>

      <section className="py-24 bg-slate-900/50 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="mb-12 lg:mb-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-semibold mb-6">
                <IoCheckmarkDoneCircle className="text-lg" /> Granular Control
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Mark every single episode. Watch your progress grow.
              </h2>
              <p className="text-lg text-slate-400 mb-8">
                No more guessing where you left off. Mark individual episodes as watched, view detailed summaries, and see dynamic progress bars for every season.
              </p>
              
              <ul className="space-y-4 text-slate-300">
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span><strong>Visual Progress:</strong> Green bars show watched episodes, blue markers highlight exactly what is to be aired next.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span><strong>Bulk Actions:</strong> Finished a binge? Mark entire seasons as complete with a single click.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span><strong>Text Colors:</strong> Instantly see if a show is returning or airing (Green), is to be determined (Orange), or has officially ended (Red).</span>
                </li>
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 rounded-2xl blur-2xl transform translate-x-4 translate-y-4" />
              <Image
                src="/images/details.png"
                width={0}
                height={0}
                sizes="100%"
                alt="Show Details and Episode Tracking" 
                className="relative rounded-2xl transition-all duration-300 hover:scale-105 border border-slate-700 shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center flex flex-col-reverse">
            
            <div className="relative mt-12 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-2xl blur-2xl transform -translate-x-4 translate-y-4" />
              <Image
                src="/images/search.png" 
                width={0}
                height={0}
                sizes="100%"
                alt="Searching for new shows and movies" 
                className="relative rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl border border-slate-700 shadow-2xl w-full"
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-semibold mb-6">
                <IoSearch className="text-lg" /> Powered by TMDB &amp; TVMaze
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Find exactly what you want to watch next.
              </h2>
              <p className="text-lg text-slate-400 mb-8">
                Search through millions of movies and TV shows instantly. Access rich metadata including trailers, ratings, runtimes, and upcoming theater releases.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <IoStar className="text-yellow-400 text-2xl mb-3" />
                  <h4 className="text-white font-bold mb-1">Rich Metadata</h4>
                  <p className="text-sm text-slate-400">View IMDb links, genres, and community ratings.</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <IoList className="text-blue-400 text-2xl mb-3" />
                  <h4 className="text-white font-bold mb-1">Smart Sorting</h4>
                  <p className="text-sm text-slate-400">Sort watchlists by air dates or completion status.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800/60 bg-[#0B1120] relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-emerald-900/20 blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 py-20 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to organize your watch history?
          </h2>
          <p className="text-slate-400 mb-8 text-lg">
            Join now to start building your personal library!
          </p>
          <button
            onClick={() => signIn("google")}
            className="px-8 py-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-lg transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] cursor-pointer"
          >
            Start Tracking
          </button>
        </div>
        
        <div className="border-t border-slate-800/60 py-6 text-center text-slate-600 text-sm">
          <p>© {new Date().getFullYear()} TV Tracker. Powered by TMDB & TVMaze.</p>
        </div>
      </footer>

    </div>
  );
}