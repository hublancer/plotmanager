
"use client";

import { createContext, useState, useMemo, type ReactNode, useCallback, useRef, useEffect } from 'react';

interface LoadingContextType {
  progress: number;
  start: () => void;
  complete: () => void;
  isLoading: boolean;
}

export const LoadingContext = createContext<LoadingContextType>({
  progress: 0,
  start: () => {},
  complete: () => {},
  isLoading: false,
});

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Use a ref to track loading state to keep callbacks stable
  const isLoadingRef = useRef(isLoading);
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  const start = useCallback(() => {
    setIsLoading(true);
    setProgress(1);

    if (timerRef.current) clearTimeout(timerRef.current);

    const work = () => {
        timerRef.current = setTimeout(() => {
            setProgress(p => {
                if (p >= 95) {
                    if (timerRef.current) clearTimeout(timerRef.current);
                    return 95;
                }
                
                let amount = 0;
                if (p < 20) amount = 10;
                else if (p < 50) amount = 4;
                else if (p < 80) amount = 2;
                else amount = 0.5;
                
                const newP = p + amount;
                if (newP < 95 && isLoadingRef.current) {
                    work();
                }
                return newP;
            });
        }, 150);
    }
    work();
  }, []); // Stable callback

  const complete = useCallback(() => {
    if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
    }
    
    // Only act if we were in a loading state. We check the ref to ensure
    // we have the most up-to-date value without making this callback unstable.
    if (isLoadingRef.current) { 
      setProgress(100);
      setTimeout(() => {
          setProgress(0);
          setIsLoading(false);
      }, 400);
    }
  }, []); // Stable callback

  const value = useMemo(() => ({ progress, start, complete, isLoading }), [progress, isLoading, start, complete]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}
