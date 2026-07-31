import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/Header";
import { SnackbarProvider } from "notistack";
import { Analytics } from "@vercel/analytics/react"
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  const { session, ...restPageProps } = pageProps;

  return (
    <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} maxSnack={3}>
      <SessionProvider session={session}>
        <Head>
          <title>TV Tracker</title>
        </Head>
        <Header />
        <Component {...restPageProps} />
        <Analytics beforeSend={(event) => {
          if (typeof window != 'undefined' && localStorage.getItem('skipAnalytics') == 'true') return null;
          return event;
        }} />
      </SessionProvider>
    </SnackbarProvider>
  );
}