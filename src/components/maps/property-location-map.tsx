
"use client";

// Leaflet CSS is imported in RootLayout
import 'leaflet-defaulticon-compatibility'; // Import directly at top level

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
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
  // We now rely on the parent component's dynamic import with `ssr: false`
  // to ensure this only ever runs on the client. This removes the need for
  // the internal `isClient` state, which simplifies logic and prevents re-renders
  // that could cause the initialization error.

  const mapCenter = position || DEFAULT_CENTER;
  const currentZoom = position ? (zoom || LOCATION_SET_ZOOM) : DEFAULT_ZOOM;

  return (
    <MapContainer
      center={mapCenter}
      zoom={currentZoom}
      scrollWheelZoom={interactive}
      dragging={interactive}
      touchZoom={interactive}
      doubleClickZoom={interactive}
      className={cn("w-full rounded-md shadow-md", className)}
      style={{ height: mapHeight, zIndex: 0 }} // zIndex important for ShadCN dialogs/popovers
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
