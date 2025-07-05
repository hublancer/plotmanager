"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  return (
    <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <span>{format(time, 'PPP')}</span>
      <span className="font-mono bg-muted px-2 py-1 rounded-md">{format(time, 'p')}</span>
    </div>
  );
}
