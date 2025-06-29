
"use client";

import { useContext } from 'react';
import { LoadingContext } from '@/context/loading-context';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageLoader() {
  const { isLoading } = useContext(LoadingContext);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ease-in-out",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      aria-live="polite"
      aria-busy={isLoading}
    >
      {isLoading && <Loader2 className="h-10 w-10 animate-spin text-primary" />}
    </div>
  );
}
