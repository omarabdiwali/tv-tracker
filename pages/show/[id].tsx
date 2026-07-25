import ShowDetails from "@/components/ShowDetails";
import { ShowProps } from "@/utils/types";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Details() {
  const router = useRouter();
  const { id } = router.query;

  const [error, setError] = useState("");
  const [show, setShow] = useState<ShowProps | null>(null);
  
  useEffect(() => {
    if (id) {
      setError('');
      fetchDetails(id as string);
    }
  }, [id])

  const fetchDetails = async (showId: string) => {
    fetch(`/api/show/details?id=${showId}`).then(res => res.json()).then(data => {
      if (data.success) {
        const obj = { ...data.show, saved: data.saved, watched: new Set(data.watched) };
        setShow(obj);
      } else {
        setError(data.message);
      }
    }).catch(err => {
      console.log(err);
      setError(err.message);
    })
  }

  function Title() {
    return (
      <Head>
        <title>{show ? `${show.title} | TV Tracker` : 'TV Tracker'}</title>
      </Head>
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

  if (show == null) {
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
      {show && <ShowDetails show={show} />}
    </>
  );
}