import { useState } from 'react';

interface StarRatingProps {
  rating?: number;
  id: string;
  type: string;
}

const LeftFullHalf = ({ loading }: { loading: boolean }) => {
  return (
    <svg
      xmlns="http://w3.org"
      width={16}
      height={32}
      viewBox="0 0 12 24"
      className={`text-yellow-300 fill-yellow-300 ${loading ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
      stroke='currentColor'
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
};

const RightFullHalf = ({ loading }: { loading: boolean }) => {
  return (
    <svg
      xmlns="http://w3.org"
      width={16}
      height={32}
      viewBox="12 0 12 24"
      className={`text-yellow-300 fill-yellow-300 ${loading ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
      stroke='currentColor'
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
};

const LeftEmptyHalf = ({ loading }: { loading: boolean }) => {
  return (
    <svg
      xmlns="http://w3.org"
      width={16}
      height={32}
      viewBox="0 0 12 24"
      className={`text-slate-700 ${loading ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
      stroke='currentColor'
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
};

const RightEmptyHalf = ({ loading }: { loading: boolean }) => {
  return (
    <svg
      xmlns="http://w3.org"
      width={16}
      height={32}
      viewBox="12 0 12 24"
      className={`text-slate-700 ${loading ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
      stroke='currentColor'
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
};

export default function StarRating({ rating = 0, type, id }: StarRatingProps) {
  const [hoverFilled, setHoverFilled] = useState(0);
  const [filled, setFilled] = useState(rating);
  const [loading, setLoading] = useState(false);
  const display = hoverFilled || filled;

  const handleHover = (index: number) => {
    if (loading) return;
    setHoverFilled(index + 0.5);
  }
  
  const handleClick = (index: number) => {
    if (loading) return;
    const newRating = index + 0.5;
    const prevRating = filled;
    setLoading(true);
    setFilled(newRating);
    
    fetch(`/api/${type}/rating`, {
      method: 'POST',
      body: JSON.stringify({ id, rating: newRating }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json()).then(data => {
      if (data.success) {
        setFilled(newRating);
      } else {
        if (data.message == 'Unauthenticated user.') {
          window.location.href = '/';
          return;
        } else {
          alert(data.message);
          setFilled(prevRating);
        }
      }
    }).finally(() => setLoading(false))
  }

  const handleLeave = () => {
    setHoverFilled(0);    
  }

  return (
    <div className="flex items-center justify-center gap-2" onMouseLeave={handleLeave}>
      <div onMouseLeave={handleLeave} className="flex">
        {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5].map((val, key) => {
          const halfFull = key % 2 == 0 ? <LeftFullHalf loading={loading} /> : <RightFullHalf loading={loading} />
          const halfEmpty = key % 2 == 0 ? <LeftEmptyHalf loading={loading} /> : <RightEmptyHalf loading={loading} />;

          return (
            <div onClick={() => { handleClick(val) }} key={`${val}-star`} onMouseLeave={handleLeave} onMouseOver={() => { handleHover(val) }}>
              {val < hoverFilled ? halfFull : !hoverFilled && val < filled ? halfFull : halfEmpty}
            </div>
          )
        })}
      </div>
      <span className="text-sm text-gray-400 min-w-[2.5rem]">{display}/5</span>
    </div>
  );
}