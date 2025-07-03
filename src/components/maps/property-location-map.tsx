
"use client";

import { firebaseConfig } from '@/lib/firebase';
import { cn } from "@/lib/utils";

interface LocationMapEmbedProps {
  coordinates?: { lat: number; lng: number } | null;
  address?: string | null;
  className?: string;
  zoom?: number;
}

export function LocationMapEmbed({
  coordinates,
  address,
  className,
  zoom = 15,
}: LocationMapEmbedProps) {
  const apiKey = firebaseConfig.apiKey;

  if (!apiKey) {
    return (
      <div className={cn("w-full h-full flex items-center justify-center bg-muted text-destructive p-4", className)}>
        <p>API key is missing. Cannot display map.</p>
      </div>
    );
  }

  let src = '';
  if (coordinates?.lat && coordinates?.lng) {
    // Use coordinates if available
    src = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${coordinates.lat},${coordinates.lng}&zoom=${zoom}`;
  } else if (address) {
    // Fallback to address search
    src = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}`;
  } else {
    // No location data provided
    return (
      <div className={cn("w-full h-full flex items-center justify-center bg-muted text-muted-foreground p-4", className)}>
        <p>No location data provided to display map.</p>
      </div>
    );
  }

  return (
    <iframe
      width="100%"
      height="100%"
      style={{ border: 0 }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={src}
      className={className}
    ></iframe>
  );
}
