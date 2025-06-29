
"use client";

import { useContext } from 'react';
import { LoadingContext } from '@/context/loading-context';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function PageLoader() {
  const { progress } = useContext(LoadingContext);

  return (
    <Progress 
        value={progress} 
        className={cn(
            "fixed top-0 left-0 right-0 h-1 z-[9999] w-full rounded-none bg-transparent",
            "transition-opacity duration-300",
            // The bar should be visible while loading, and fade out when complete
            progress > 0 && progress < 100 ? "opacity-100" : "opacity-0"
        )}
    />
  );
}
