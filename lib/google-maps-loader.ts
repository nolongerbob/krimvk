import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

let configured = false;

export async function loadGoogleMaps() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error('Google Maps is not configured');
  if (!configured) {
    setOptions({ key, v: 'quarterly', language: 'ru' });
    configured = true;
  }
  return importLibrary('maps') as Promise<google.maps.MapsLibrary>;
}

export async function loadGoogleGeocoder() {
  await loadGoogleMaps();
  return importLibrary('geocoding') as Promise<google.maps.GeocodingLibrary>;
}
