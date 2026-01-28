"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  const [isReady, setIsReady] = useState(false);

  // Проверяем, загружен ли Leaflet
  const checkLeafletLoaded = useCallback(() => {
    return typeof window !== "undefined" && window.L;
  }, []);

  // Загрузка Leaflet
  useEffect(() => {
    // Если Leaflet уже загружен
    if (checkLeafletLoaded()) {
      setIsReady(true);
      return;
    }

    // Проверяем, есть ли уже скрипт
    const existingScript = document.querySelector('script[src*="leaflet"]');
    if (existingScript) {
      // Ждём загрузки существующего скрипта
      const checkInterval = setInterval(() => {
        if (checkLeafletLoaded()) {
          setIsReady(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    // Загружаем CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Загружаем JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => setIsReady(true);
    document.head.appendChild(script);

    return () => {
      // Не удаляем скрипт при размонтировании
    };
  }, [checkLeafletLoaded]);

  // Инициализация карты
  useEffect(() => {
    if (!isReady || !mapRef.current) return;

    const L = window.L;
    if (!L) return;

    // Если карта уже существует, удаляем её
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Центр Крыма
    const crimeaCenter: [number, number] = [45.0, 34.0];
    
    // Создаём карту
    const map = L.map(mapRef.current, {
      center: crimeaCenter,
      zoom: 8,
      scrollWheelZoom: true,
      attributionControl: false,
    });

    // Добавляем слой карты
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Добавляем маркеры
    if (markers.length > 0) {
      addMarkers(L, map, markers);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isReady, markers]);

  return (
    <>
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
        className="h-[350px] w-full relative"
        style={{ zIndex: 1 }}
      >
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}
      </div>
    </>
  );
}

// Функция добавления маркеров
function addMarkers(L: any, map: any, markers: Marker[]) {
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
  const bounds = markerGroup.getBounds();
  map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
}
