
"use client";

// Leaflet CSS is imported in RootLayout
// Import leaflet-defaulticon-compatibility to make default icons work with bundlers like Webpack

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import type L from 'leaflet'; // Import Leaflet type for map instance
import type { LatLngExpression } from 'leaflet';
import { useEffect, useState, useRef } from 'react'; 
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
  const mapRef = useRef<L.Map | null>(null); 

  useEffect(() => {
    setIsClient(true);
    // Dynamically import leaflet-defaulticon-compatibility only on the client-side
    import('leaflet-defaulticon-compatibility');
  }, []);

  // Effect for cleaning up the map instance on unmount
  useEffect(() => {
    // This cleanup runs when the PropertyLocationMap component unmounts.
    // The key prop on this component's instance (e.g., in PropertyForm or PropertyDetailsPage)
    // is important for forcing React to unmount and remount it,
    // allowing this cleanup logic to run effectively.
    return () => {
      if (mapRef.current) {
        mapRef.current.remove(); // Properly destroy the Leaflet map instance
        mapRef.current = null;   // Nullify the ref
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
  // Use the zoom prop if provided and a position is set, otherwise use LOCATION_SET_ZOOM for a new pin or DEFAULT_ZOOM for initial view.
  const currentZoom = position ? (zoom || LOCATION_SET_ZOOM) : DEFAULT_ZOOM;

  return (
    <MapContainer
      // Removed the key from here. We rely on the parent component's keying of PropertyLocationMap
      // to ensure this component, and thus the MapContainer, is fully remounted.
      center={mapCenter}
      zoom={currentZoom}
      scrollWheelZoom={interactive}
      dragging={interactive}
      touchZoom={interactive}
      doubleClickZoom={interactive}
      className={cn("w-full rounded-md shadow-md", className)}
      style={{ height: mapHeight, zIndex: 0 }} // zIndex important for ShadCN dialogs/popovers
      whenCreated={instance => { mapRef.current = instance; }} 
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

