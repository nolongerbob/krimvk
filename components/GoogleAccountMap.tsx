'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { loadGoogleGeocoder, loadGoogleMaps } from '@/lib/google-maps-loader';

const center = { lat: 45.266614, lng: 34.520339 };
// Reference framing chosen in the 404 × 338px desktop map (zoom 7).
const overviewSize = { width: 404, height: 338 };
const serviceBounds = { south: 44.3, north: 46.3, west: 32.4, east: 36.7 };
const normalizeLocality = (value: string) => value.toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/[\s-]+/g, ' ').trim();

function addressLocality(address: string) {
  return address.match(/(?:^|[,;]\s*)(?:село|город|пос[её]лок|деревня|пгт|пос\.?|[гспд]\.)\s*([^,;]+)/i)?.[1].trim();
}

function matchesAddress(result: google.maps.GeocoderResult, locality?: string) {
  const position = result.geometry.location;
  if (position.lat() < serviceBounds.south || position.lat() > serviceBounds.north || position.lng() < serviceBounds.west || position.lng() > serviceBounds.east) return false;
  return !locality || result.address_components.some(component =>
    component.types.some(type => type === 'locality' || type.startsWith('sublocality'))
    && normalizeLocality(component.long_name) === normalizeLocality(locality));
}

const styles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#326553' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#e4ebf3' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#263e47' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#192f65' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#91b4dd' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#316b56' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#374957' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#677f96' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#334959' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#849694' }] },
];

export function GoogleAccountMap({ address }: { address: string | null }) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<google.maps.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [lookup, setLookup] = useState<{ address: string; status: 'ready' | 'approximate' | 'error' } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let disposed = false;
    let idle: google.maps.MapsEventListener | undefined;
    let resize: ResizeObserver | undefined;
    const timer = setTimeout(() => { if (!disposed) setMapError(true); }, 20000);
    async function initialize() {
      const { Map } = await loadGoogleMaps();
      if (disposed || !host.current) return;
      const map = new Map(host.current, {
        center, zoom: 7, isFractionalZoomEnabled: true, styles, backgroundColor: '#192f65',
        disableDefaultUI: true, gestureHandling: 'cooperative', keyboardShortcuts: false,
        clickableIcons: false,
      });
      instance.current = map;
      let previousSize = '';
      const fitOverview = () => {
        if (disposed || !host.current) return;
        const { width, height } = host.current.getBoundingClientRect();
        if (!width || !height) return;
        const size = `${Math.round(width)}:${Math.round(height)}`;
        if (size === previousSize) return;
        previousSize = size;
        // Keep the chosen framing at different panel sizes without integer-zoom
        // rounding, which left a large amount of empty sea around the peninsula.
        const scale = Math.min(width / overviewSize.width, height / overviewSize.height);
        const zoom = Math.max(5, Math.min(8, 7 + Math.log2(scale)));
        map.moveCamera({ center, zoom });
      };
      // Fit the whole peninsula, including after a collapsed mobile map opens.
      // Tile loads and account changes must not reset a user's chosen zoom.
      fitOverview();
      resize = new ResizeObserver(fitOverview);
      resize.observe(host.current);
      idle = map.addListener('tilesloaded', () => {
        clearTimeout(timer);
        if (!disposed) { setMapError(false); setReady(true); }
      });
    }
    initialize().catch(() => { if (!disposed) { clearTimeout(timer); setMapError(true); } });
    return () => {
      disposed = true;
      clearTimeout(timer);
      idle?.remove();
      resize?.disconnect();
      instance.current = null;
    };
  }, []);

  useEffect(() => {
    setLookup(null);
    const map = instance.current;
    if (!ready || !map) return;
    // The previous effect removes its marker; keep the full-region camera.
    if (!address) return;
    const selectedAddress = address;
    const activeMap = map;
    let disposed = false;
    let marker: google.maps.OverlayView | undefined;
    const timer = setTimeout(() => {
      disposed = true;
      setLookup({ address, status: 'error' });
    }, 15000);
    async function locate() {
      const [{ Geocoder }, { OverlayView }] = await Promise.all([loadGoogleGeocoder(), loadGoogleMaps()]);
      if (disposed) return;
      // Send only the address, never the account ID/number, name or billing data.
      const query = /Республика\s+Крым|Крым\s*респ|Crimea/i.test(selectedAddress) ? selectedAddress : `Республика Крым, ${selectedAddress}`;
      const locality = addressLocality(selectedAddress);
      const geocoder = new Geocoder();
      const requestOptions = { bounds: serviceBounds, fulfillOnZeroResults: true, ...(locality ? { componentRestrictions: { locality } } : {}) };
      const { results } = await geocoder.geocode({ address: query, ...requestOptions });
      if (disposed) return;
      let result = results.find(candidate => matchesAddress(candidate, locality));
      let settlementOnly = false;
      if (!result && locality) {
        // A street can be absent from Google's map. Try the same settlement once,
        // never silently accept a similarly named street in a different town.
        const fallback = await geocoder.geocode({ address: `Республика Крым, ${locality}`, ...requestOptions });
        if (disposed) return;
        result = fallback.results.find(candidate => matchesAddress(candidate, locality));
        settlementOnly = true;
      }
      if (!result) throw new Error('Address not found');
      const position = result.geometry.location;
      const exact = !settlementOnly && !result.partial_match && result.types.some(type => ['street_address', 'premise', 'subpremise'].includes(type));
      class AccountPin extends OverlayView {
        private element = document.createElement('div');
        onAdd() {
          this.element.setAttribute('role', 'img');
          this.element.setAttribute('aria-label', exact ? 'Адрес выбранного счёта' : 'Примерное расположение адреса');
          this.element.title = exact ? 'Адрес выбранного счёта' : 'Примерное расположение · точный дом не найден';
          this.element.style.cssText = 'position:absolute;width:26px;height:26px;border:5px solid white;border-radius:50% 50% 50% 0;background:#2563eb;box-shadow:0 2px 12px #1e3a8a55;transform:translate(-50%,-100%) rotate(-45deg)';
          this.getPanes()?.overlayLayer.appendChild(this.element);
        }
        draw() {
          const point = this.getProjection().fromLatLngToDivPixel(position);
          if (point) { this.element.style.left = `${point.x}px`; this.element.style.top = `${point.y}px`; }
        }
        onRemove() { this.element.remove(); }
      }
      marker = new AccountPin();
      marker.setMap(activeMap);
      clearTimeout(timer);
      setLookup({ address: selectedAddress, status: exact ? 'ready' : 'approximate' });
    }
    locate().catch(() => {
      if (!disposed) { clearTimeout(timer); setLookup({ address, status: 'error' }); }
    });
    return () => { disposed = true; clearTimeout(timer); marker?.setMap(null); };
  }, [address, ready, attempt]);

  const status = lookup?.address === address ? lookup?.status : null;
  const message = mapError ? 'Карта временно недоступна'
    : !address ? 'Здесь будет ваш адрес'
    : status === 'error' ? 'Не удалось найти адрес на карте'
    : status === 'approximate' ? 'Примерное расположение · точный дом не найден'
    : !status ? 'Ищем адрес на карте…' : null;

  return <div className="absolute inset-0 overflow-hidden bg-[#192f65]">
    <div ref={host} className={['h-full', 'w-full', process.env.NODE_ENV === 'development' ? 'account-map-dev-preview' : ''].filter(Boolean).join(' ')} aria-label="Карта адреса лицевого счёта" />
    <style jsx global>{`
      .account-map-dev-preview .gm-style-cc,
      .account-map-dev-preview a:has(img[alt="Google"]),
      .account-map-dev-preview a:has(img[alt="Google Maps"]) { display: none !important; }
    `}</style>
    {message && <p className="sr-only" role="status">{message}</p>}
    {address && !mapError && !status && <Loader2 aria-hidden className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-spin text-blue-600" />}
    {status === 'error' && !mapError && <button type="button" aria-label="Повторить поиск адреса" title="Не удалось найти адрес. Повторить поиск" onClick={() => setAttempt(value => value + 1)} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-blue-50"><RotateCcw size={16} aria-hidden /></button>}
  </div>;
}
