"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Loader2 } from "lucide-react";

interface Marker {
  id: number;
  name: string;
  coords: [number, number];
  text: string;
  time: string;
}

interface EmergencyMapProps {
  markers: Marker[];
}

declare global {
  interface Window {
    L: typeof import("leaflet");
  }
}

export default function EmergencyMap({ markers }: EmergencyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Инициализация карты после загрузки Leaflet
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = window.L;
    if (!L) return;

    // Центр Крыма
    const crimeaCenter: [number, number] = [45.0, 34.0];
    
    // Создаём карту без атрибуции
    const map = L.map(mapRef.current, {
      center: crimeaCenter,
      zoom: 8,
      scrollWheelZoom: true,
      attributionControl: false,
    });

    // Добавляем слой карты (OpenStreetMap) без атрибуции
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isLoaded]);

  // Обновляем маркеры при изменении данных
  useEffect(() => {
    if (!isLoaded) return;
    
    const L = window.L;
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    // Удаляем старые маркеры
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    if (markers.length === 0) return;

    // Красная иконка для аварий
    const emergencyIcon = L.divIcon({
      className: "emergency-marker",
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M12 2L2 22h20L12 2z"/>
            <path d="M12 9v4"/>
            <circle cx="12" cy="17" r="1"/>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });

    // Добавляем новые маркеры
    const markerGroup = L.featureGroup();

    markers.forEach((marker) => {
      const popupContent = `
        <div style="min-width: 200px; max-width: 300px;">
          <div style="font-weight: 600; color: #dc2626; margin-bottom: 4px; font-size: 14px;">
            ⚠️ ${marker.name}
          </div>
          <div style="font-size: 11px; color: #666; margin-bottom: 8px;">
            ${marker.time}
          </div>
          <div style="font-size: 13px; line-height: 1.4; color: #333; white-space: pre-wrap;">
            ${marker.text.length > 200 ? marker.text.substring(0, 200) + "..." : marker.text}
          </div>
        </div>
      `;

      const leafletMarker = L.marker(marker.coords, { icon: emergencyIcon })
        .bindPopup(popupContent, {
          maxWidth: 350,
          className: "emergency-popup",
        });

      markerGroup.addLayer(leafletMarker);
    });

    markerGroup.addTo(map);

    // Подгоняем вид карты под все маркеры
    if (markers.length > 0) {
      const bounds = markerGroup.getBounds();
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [markers, isLoaded]);

  return (
    <>
      {/* Загружаем Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      
      {/* Загружаем Leaflet JS */}
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossOrigin=""
        onLoad={() => setIsLoaded(true)}
      />

      <style jsx global>{`
        .emergency-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .emergency-popup .leaflet-popup-content {
          margin: 12px 14px;
        }
        .emergency-popup .leaflet-popup-tip {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .emergency-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      
      <div 
        ref={mapRef} 
        className="h-[400px] w-full rounded-lg relative"
        style={{ zIndex: 1 }}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}
      </div>
    </>
  );
}
