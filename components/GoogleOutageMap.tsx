"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from '@/lib/google-maps-loader';

type Incident = { id: string; place: string; status: string; color: string; coords: [number, number] };
const darkStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#326553" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#e4ebf3" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#263e47" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#192f65" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#91b4dd" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#316b56" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#374957" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#677f96" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#334959" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#849694" }] },
];

export function GoogleOutageMap({ incidents, visibleIds, activeId, onSelect }: {
  incidents: Incident[]; visibleIds: string[]; activeId?: string; onSelect: (id: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map>();
  const markers = useRef<Record<string, { overlay: google.maps.OverlayView; button: HTMLButtonElement }>>({});
  const select = useRef(onSelect);
  select.current = onSelect;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let disposed = false;
    let resize: ResizeObserver | undefined;
    const timeout = setTimeout(() => { if (!disposed) setError(true); }, 20000);
    const authWindow = window as Window & { gm_authFailure?: () => void };
    const previousFailure = authWindow.gm_authFailure;
    const authFailure = () => { if (!disposed) setError(true); };
    authWindow.gm_authFailure = authFailure;
    async function initialize() {
      const { Map, OverlayView } = await loadGoogleMaps();
      if (disposed || !host.current) return;
      const instance = new Map(host.current, {
        center: { lat: 45.13, lng: 33.60 }, zoom: 11,
        styles: darkStyle, backgroundColor: "#192f65",
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        disableDefaultUI: true, cameraControl: false,
        gestureHandling: "cooperative", zoomControl: false,
      });
      map.current = instance;
      incidents.forEach((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'outage-radar-marker';
        button.setAttribute('aria-label', `${item.place}: ${item.status}`);
        button.title = `${item.place}: ${item.status}`;
        button.style.setProperty('--marker-color', item.color);
        button.style.setProperty('--marker-delay', `${index * -.7}s`);
        for (let i = 0; i < 2; i++) {
          const ring = document.createElement('span');
          ring.className = `outage-radar-ring outage-radar-ring-${i}`;
          ring.setAttribute('aria-hidden', 'true');
          button.appendChild(ring);
        }
        const core = document.createElement('span');
        core.className = 'outage-radar-core';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '1.8');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        const paths = item.id === 'repair'
          ? ['M10.3 4.9a2 2 0 0 1 3.4 0l7 12.1a2 2 0 0 1-1.7 3H5a2 2 0 0 1-1.7-3Z', 'M12 9v4', 'M12 16h.01']
          : item.id === 'planned'
          ? ['M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94Z']
          : ['M12 3C10 6.5 5 10.5 5 14a7 7 0 0 0 14 0c0-3.5-5-7.5-7-11Z', 'M9 14h6'];
        // Centre each outline's actual bounds within the shared 24 × 24 viewBox.
        const glyph = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        glyph.setAttribute('transform', item.id === 'planned' ? 'translate(-0.5 0.5)' : 'translate(0 0)');
        paths.forEach(d => { const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', d); glyph.appendChild(path); });
        svg.appendChild(glyph);
        core.appendChild(svg); button.appendChild(core);
        const click = () => select.current(item.id);
        class RadarOverlay extends OverlayView {
          onAdd() { this.getPanes()?.overlayMouseTarget.appendChild(button); button.addEventListener('click', click); OverlayView.preventMapHitsAndGesturesFrom(button); }
          draw() {
            const point = this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(item.coords[0], item.coords[1]));
            if (point) { button.style.left = `${point.x}px`; button.style.top = `${point.y}px`; }
          }
          onRemove() { button.removeEventListener('click', click); button.remove(); }
        }
        const overlay = new RadarOverlay();
        overlay.setMap(instance);
        markers.current[item.id] = { overlay, button };
      });
      instance.addListener("tilesloaded", () => { if (!disposed) { clearTimeout(timeout); setReady(true); } });
      resize = new ResizeObserver(() => google.maps.event.trigger(instance, "resize"));
      resize.observe(host.current);
    }
    initialize().catch(() => { if (!disposed) setError(true); });
    return () => {
      disposed = true; clearTimeout(timeout); resize?.disconnect();
      if (authWindow.gm_authFailure === authFailure) authWindow.gm_authFailure = previousFailure;
      Object.values(markers.current).forEach(marker => marker.overlay.setMap(null));
      markers.current = {};
      if (map.current) google.maps.event.clearInstanceListeners(map.current);
      map.current = undefined;
    };
  }, [incidents]);
  useEffect(() => {
    if (!ready || !map.current) return;
    incidents.forEach(item => {
      const marker = markers.current[item.id];
      if (marker) {
        marker.button.hidden = !visibleIds.includes(item.id);
        marker.button.setAttribute('aria-pressed', String(item.id === activeId));
        marker.button.style.zIndex = item.id === activeId ? '2' : '1';
      }
    });
    const active = incidents.find(item => item.id === activeId);
    if (active) map.current.panTo({ lat: active.coords[0], lng: active.coords[1] });
  }, [ready, incidents, activeId, visibleIds]);
  return <>
    <div ref={host} className={`absolute inset-0 ${process.env.NODE_ENV === "development" ? "outage-map-compact-credits" : ""}`} role="region" aria-label="Google Карта с тестовыми отметками отключений" />
    {/* Dev-only visual experiment; remove this block to restore Google's defaults. */}
    <style jsx global>{`
      .outage-radar-marker { position: absolute; width: 40px; height: 40px; padding: 0; border: 0; background: transparent; transform: translate(-50%, -50%); cursor: pointer; overflow: visible; }
      .outage-radar-core { position: absolute; inset: 7px; display: grid; place-items: center; border-radius: 50%; background: color-mix(in srgb, var(--marker-color) 50%, transparent); color: #fffffff0; border: 0; transition: background .2s ease; }
      .outage-radar-core svg { display: block; width: 15px; height: 15px; overflow: visible; }
      .outage-radar-marker[aria-pressed="true"] .outage-radar-core, .outage-radar-marker:hover .outage-radar-core { background: color-mix(in srgb, var(--marker-color) 65%, transparent); }
      .outage-radar-marker:focus-visible { outline: 2px solid white; outline-offset: 4px; border-radius: 50%; }
      .outage-radar-ring { position: absolute; inset: 7px; border-radius: 50%; border: 0; background: var(--marker-color); pointer-events: none; animation: outage-radar-pulse 3.2s ease-out infinite; animation-delay: var(--marker-delay); }
      .outage-radar-ring-1 { animation-delay: calc(var(--marker-delay) - 1.6s); }
      @keyframes outage-radar-pulse { 0% { transform: scale(1); opacity: .24; } 80%,100% { transform: scale(2.8); opacity: 0; } }
      @media (prefers-reduced-motion: reduce) { .outage-radar-ring { animation: none; opacity: .06; transform: scale(1.45); } .outage-radar-core { transition: none; } }
      .outage-map-compact-credits .gm-style-cc,
      .outage-map-compact-credits a:has(img[alt="Google"]) {
        display: none !important;
      }
    `}</style>
    {(!ready || error) && <div role="status" className="pointer-events-none absolute left-3 top-3 z-10 max-w-[85%] bg-slate-900/95 p-3 text-xs text-white">{error ? "Google Maps не загрузилась. Проверьте включение Maps JavaScript API, биллинг и ограничения ключа. Список сообщений доступен ниже." : "Загружаем Google Maps…"}</div>}
  </>;
}
