import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/Header";
import { SnackbarProvider } from "notistack";
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
      </SessionProvider>
    </SnackbarProvider>
  );
}