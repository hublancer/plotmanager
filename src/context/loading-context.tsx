
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setIsLoading(true);
    setProgress(1);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 95) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 95;
        }
        
        let amount = 0;
        if (p < 20) amount = 10;
        else if (p < 50) amount = 4;
        else if (p < 80) amount = 2;
        else amount = 0.5;
        
        return p + amount;
      });
    }, 150);
  }, []);

  const complete = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Only complete if we were actually loading
    if (isLoading) { 
      setProgress(100);
      setTimeout(() => {
          // Check if a new loading process has started in the meantime
          if (!intervalRef.current) {
            setIsLoading(false);
            setProgress(0);
          }
      }, 400);
    }
  }, [isLoading]);

  const value = useMemo(() => ({ progress, start, complete, isLoading }), [progress, isLoading, start, complete]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}
