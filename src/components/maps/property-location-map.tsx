
"use client";

// Leaflet CSS is imported in RootLayout
// Import leaflet-defaulticon-compatibility to make default icons work with bundlers like Webpack
import 'leaflet-defaulticon-compatibility'; 

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import type L from 'leaflet'; // Import Leaflet type for map instance
import type { LatLngExpression } from 'leaflet';
import { useEffect, useState, useRef } from 'react'; // Added useRef
import { cn } from "@/lib/utils";

interface PropertyLocationMapProps {
  position: LatLngExpression | null | undefined; // Can be null or undefined if not set
  zoom?: number;
  popupText?: string;
  className?: string;
  interactive?: boolean;
  mapHeight?: string; // Allow customizing height
  onPositionChange?: (position: { lat: number; lng: number }) => void;
}

const DEFAULT_CENTER: LatLngExpression = [30.3753, 69.3451]; // Approx center of Pakistan
const DEFAULT_ZOOM = 5;
const LOCATION_SET_ZOOM = 14;

// This component is needed because useMapEvents must be a child of MapContainer
function MapEventsHandler({ onPositionChange }: { onPositionChange?: PropertyLocationMapProps['onPositionChange'] }) {
  useMapEvents({
    click(e) {
      if (onPositionChange) {
        onPositionChange(e.latlng);
      }
    },
  });
  return null;
}


export function PropertyLocationMap({
  position,
  zoom,
  popupText,
  className,
  mapHeight = "300px",
  interactive = true,
  onPositionChange,
}: PropertyLocationMapProps) {
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<L.Map | null>(null); // Ref to store map instance

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect for cleaning up the map instance on unmount
  useEffect(() => {
    // The key prop on this component's instance (e.g., in PropertyForm)
    // is important for forcing React to unmount and remount it,
    // allowing this cleanup logic to run effectively.
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Empty dependency array: runs cleanup only on unmount

  if (!isClient) {
    return (
      <div 
        className={cn("bg-muted flex items-center justify-center rounded-md", className)} 
        style={{ height: mapHeight }}
      >
        <p>Loading map...</p>
      </div>
    );
  }

  const mapCenter = position || DEFAULT_CENTER;
  const mapZoom = position ? (zoom || LOCATION_SET_ZOOM) : DEFAULT_ZOOM;

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      scrollWheelZoom={interactive}
      dragging={interactive}
      touchZoom={interactive}
      doubleClickZoom={interactive}
      className={cn("w-full rounded-md shadow-md", className)}
      style={{ height: mapHeight, zIndex: 0 }} // zIndex important for ShadCN dialogs/popovers
      whenCreated={instance => { mapRef.current = instance; }} // Store map instance
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {position && (
        <Marker position={position}>
          {popupText && <Popup>{popupText}</Popup>}
        </Marker>
      )}
      {onPositionChange && <MapEventsHandler onPositionChange={onPositionChange} />}
    </MapContainer>
  );
}

