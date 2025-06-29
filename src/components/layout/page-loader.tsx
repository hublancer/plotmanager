
"use client";

import { useContext } from 'react';
import { LoadingContext } from '@/context/loading-context';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { PlotPilotLogo } from '@/components/icons/logo';

export function PageLoader() {
  const { progress, isLoading } = useContext(LoadingContext);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm",
        "transition-opacity duration-300 ease-in-out",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      aria-live="polite"
      aria-busy={isLoading}
    >
      <Progress 
        value={progress} 
        className="absolute top-0 left-0 h-1 w-full rounded-none bg-transparent"
      />
      <div className="flex flex-col items-center" aria-hidden="true">
        <PlotPilotLogo className="h-16 w-16 animate-pulse text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
