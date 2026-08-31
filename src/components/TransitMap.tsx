"use client";

import { useEffect, useRef, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import type { BusData } from "@/types";

// Vancouver, BC area center
const MAP_CENTER: [number, number] = [-123.1207, 49.2600];
const INITIAL_ZOOM = 12;

interface TransitMapProps {
  buses: BusData[];
  isLoading: boolean;
  onBusClick: (bus: BusData) => void;
  selectedBusId?: string;
  userLocation?: { latitude: number; longitude: number } | null;
}

export default function TransitMap({
  buses,
  isLoading,
  onBusClick,
  selectedBusId,
  userLocation,
}: TransitMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: [
              "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: "osm-tiles-layer",
            type: "raster",
            source: "osm-tiles",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: MAP_CENTER,
      zoom: INITIAL_ZOOM,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update bus markers
  useEffect(() => {
    if (!map.current) return;

    const updateMarkers = () => {
      buses.forEach((bus) => {
        const existingMarker = markersRef.current.get(bus.id);

        if (existingMarker) {
          // Update existing marker position
          existingMarker.setLngLat([bus.position.longitude, bus.position.latitude]);
          
          // Update rotation
          const el = existingMarker.getElement();
          el.style.transform = `rotate(${bus.heading}deg)`;
          
          // Update popup content
          const popup = existingMarker.getPopup();
          if (popup) {
            popup.setHTML(createPopupContent(bus));
          }
        } else {
          // Create new marker
          const el = document.createElement("div");
          el.className = "bus-marker";
          el.innerHTML = createBusMarkerSVG(bus.id === selectedBusId);
          el.style.transform = `rotate(${bus.heading}deg)`;
          el.style.cursor = "pointer";

          // Create popup
          const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
            createPopupContent(bus)
          );

          // Create marker
          const marker = new maplibregl.Marker({ element: el, rotation: 0 })
            .setLngLat([bus.position.longitude, bus.position.latitude])
            .setPopup(popup)
            .addTo(map.current!);

          el.addEventListener("click", () => {
            onBusClick(bus);
          });

          markersRef.current.set(bus.id, marker);
        }
      });

      // Remove markers for buses that no longer exist
      markersRef.current.forEach((marker, id) => {
        if (!buses.find((b) => b.id === id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      });
    };

    updateMarkers();
  }, [buses, selectedBusId, onBusClick]);

  // Highlight selected bus
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      const isSelected = id === selectedBusId;
      el.innerHTML = createBusMarkerSVG(isSelected);
      el.style.zIndex = isSelected ? "100" : "1";
    });

    // Pan to selected bus
    if (selectedBusId) {
      const selectedBus = buses.find((b) => b.id === selectedBusId);
      if (selectedBus) {
        map.current?.flyTo({
          center: [selectedBus.position.longitude, selectedBus.position.latitude],
          zoom: 14,
          duration: 1000,
        });
      }
    }
  }, [selectedBusId, buses]);

  // Handle user location marker
  useEffect(() => {
    if (!map.current) return;

    if (userLocation) {
      // Create or update user location marker
      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat([userLocation.longitude, userLocation.latitude]);
      } else {
        const el = document.createElement("div");
        el.className = "user-marker";
        el.innerHTML = createUserMarkerSVG();
        el.style.zIndex = "200"; // Above bus markers

        userMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([userLocation.longitude, userLocation.latitude])
          .addTo(map.current);

        // Pan to user location initially
        map.current?.flyTo({
          center: [userLocation.longitude, userLocation.latitude],
          zoom: 14,
          duration: 1000,
        });
      }
    } else {
      // Remove user marker if location is cleared
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    }
  }, [userLocation]);

  return (
    <>
      <style jsx global>{`
        .bus-marker {
          width: 36px;
          height: 36px;
          transition: transform 0.3s ease;
        }
        .user-marker {
          width: 24px;
          height: 24px;
          cursor: pointer;
        }
        .maplibregl-popup-content {
          padding: 12px 16px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          font-family: inherit;
        }
        .maplibregl-popup-close-button {
          font-size: 20px;
          padding: 4px 8px;
          color: #64748b;
        }
      `}</style>
      <div ref={mapContainer} className="h-full w-full" />
    </>
  );
}

function createBusMarkerSVG(isSelected: boolean) {
  const color = isSelected ? "#3b82f6" : "#8b5cf6";
  const size = isSelected ? 40 : 32;
  const shadow = isSelected ? "drop-shadow(0 4px 8px rgba(59, 130, 246, 0.5))" : "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))";
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: ${shadow}">
      <circle cx="20" cy="20" r="18" fill="${color}"/>
      <circle cx="20" cy="20" r="14" fill="white"/>
      <circle cx="20" cy="20" r="10" fill="${color}"/>
      <path d="M20 12L24 20H16L20 12Z" fill="white"/>
    </svg>
  `;
}

function createUserMarkerSVG() {
  return `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))">
      <circle cx="12" cy="12" r="10" fill="#22c55e" stroke="white" stroke-width="3"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `;
}

function createPopupContent(bus: BusData) {
  const delayClass = bus.delay > 0 ? "text-red-500" : bus.delay < 0 ? "text-blue-500" : "text-green-500";
  const delayText = bus.delay === 0 ? "On Time" : `${Math.abs(bus.delay)} min ${bus.delay > 0 ? "late" : "early"}`;
  
  return `
    <div style="min-width: 180px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 14px; font-weight: 600; color: #1e293b;">${bus.routeName}</span>
        <span style="font-size: 12px; color: #64748b;">→ ${bus.destination}</span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
        <div>
          <span style="color: #94a3b8;">Speed</span>
          <div style="font-weight: 500; color: #334155;">${bus.speed} km/h</div>
        </div>
        <div>
          <span style="color: #94a3b8;">Status</span>
          <div style="font-weight: 500;" class="${delayClass}">${delayText}</div>
        </div>
        <div style="grid-column: span 2;">
          <span style="color: #94a3b8;">Next Stop</span>
          <div style="font-weight: 500; color: #334155;">${bus.nextStop}</div>
        </div>
      </div>
    </div>
  `;
}
