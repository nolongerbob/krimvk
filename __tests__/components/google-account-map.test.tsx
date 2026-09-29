import { act, render, screen } from '@testing-library/react';
import { GoogleAccountMap } from '@/components/GoogleAccountMap';
import { loadGoogleGeocoder, loadGoogleMaps } from '@/lib/google-maps-loader';

jest.mock('@/lib/google-maps-loader', () => ({ loadGoogleMaps: jest.fn(), loadGoogleGeocoder: jest.fn() }));
const geocode = jest.fn();
const setCenter = jest.fn();
const setZoom = jest.fn();
const setMap = jest.fn();
const remove = jest.fn();
const moveCamera = jest.fn();
const mapOptions = jest.fn();
const disconnect = jest.fn();
const originalObserver = global.ResizeObserver;
let onResize: () => void;
let mapSize = { width: 360, height: 280 };
let tilesLoaded: () => void;
const result = (lat = 45.1, lng = 33.6, types = ['street_address'], locality = 'Тестовое') => ({ results: [{
  types, geometry: { location: { lat: () => lat, lng: () => lng } },
  address_components: [{ long_name: locality, short_name: locality, types: ['locality', 'political'] }],
}] });
async function ready() { await act(async () => {}); await act(async () => tilesLoaded()); }
beforeEach(() => {
  jest.clearAllMocks();
  mapSize = { width: 360, height: 280 };
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ ...mapSize, x: 0, y: 0, top: 0, left: 0, right: mapSize.width, bottom: mapSize.height, toJSON: () => ({}) }));
  global.ResizeObserver = class { constructor(callback: () => void) { onResize = callback; } observe() {} unobserve() {} disconnect = disconnect; } as unknown as typeof ResizeObserver;
  (loadGoogleMaps as jest.Mock).mockResolvedValue({
    Map: class { constructor(_host: HTMLElement, options: unknown) { mapOptions(options); } moveCamera = moveCamera; setCenter = setCenter; setZoom = setZoom; addListener(_event: string, callback: () => void) { tilesLoaded = callback; return { remove }; } },
    OverlayView: class { setMap = setMap; },
  });
  (loadGoogleGeocoder as jest.Mock).mockResolvedValue({ Geocoder: class { geocode = geocode; } });
  geocode.mockResolvedValue(result());
});
afterEach(() => { jest.restoreAllMocks(); global.ResizeObserver = originalObserver; });

it('automatically locates the account using only its address, without a consent prompt', async () => {
  render(<GoogleAccountMap address="с. Тестовое, ул. Примерная 10" />);
  await ready();
  expect(screen.queryByRole('button', { name: 'Показать адрес на карте' })).not.toBeInTheDocument();
  expect(geocode).toHaveBeenCalledWith({ address: 'Республика Крым, с. Тестовое, ул. Примерная 10', bounds: expect.anything(), fulfillOnZeroResults: true, componentRestrictions: { locality: 'Тестовое' } });
  expect(setMap).toHaveBeenCalledWith(expect.anything());
  expect(moveCamera).toHaveBeenCalledWith({ center: { lat: 45.266614, lng: 34.520339 }, zoom: 7 + Math.log2(280 / 338) });
  expect(setZoom).not.toHaveBeenCalled();
  expect(setCenter).not.toHaveBeenCalled();
  expect(screen.queryByText('Ищем адрес на карте…')).not.toBeInTheDocument();
});

it('removes the old marker and ignores a slow geocoder result after switching accounts', async () => {
  let finishOld!: (value: unknown) => void;
  const view = render(<GoogleAccountMap address="Первый адрес" />);
  await ready();
  await act(async () => {});
  geocode.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }));
  view.rerender(<GoogleAccountMap address="Второй адрес" />);
  await act(async () => {});
  expect(setMap).toHaveBeenCalledWith(null);
  view.rerender(<GoogleAccountMap address="Третий адрес" />);
  await act(async () => {});
  const callCount = setCenter.mock.calls.length;
  await act(async () => finishOld(result(45.9, 34.2)));
  expect(setCenter).toHaveBeenCalledTimes(callCount);
});

it('labels an approximate match instead of claiming it found a house', async () => {
  geocode.mockResolvedValue(result(45.1, 33.6, ['locality', 'political']));
  render(<GoogleAccountMap address="Неуточнённый адрес" />);
  await ready();
  expect(await screen.findByText('Примерное расположение · точный дом не найден')).toBeInTheDocument();
  expect(setZoom).not.toHaveBeenCalled();
});

it.each([result(55.7, 37.6), { results: [] }])('does not place a misleading marker for a missing/out-of-area address', async payload => {
  geocode.mockResolvedValue(payload);
  render(<GoogleAccountMap address="Неизвестный адрес" />);
  await ready();
  expect(await screen.findByText('Не удалось найти адрес на карте')).toBeInTheDocument();
  expect(setMap).not.toHaveBeenCalled();
});

it('provides a fallback when the map loader is unavailable', async () => {
  (loadGoogleMaps as jest.Mock).mockRejectedValue(new Error('Unavailable'));
  render(<GoogleAccountMap address="Пример адреса" />);
  expect(await screen.findByText('Карта временно недоступна')).toBeInTheDocument();
  expect(geocode).not.toHaveBeenCalled();
});

it('does not geocode an absent address', async () => {
  render(<GoogleAccountMap address={null} />);
  await ready();
  expect(geocode).not.toHaveBeenCalled();
});

it('rejects a different town and falls back only to the requested settlement', async () => {
  geocode.mockResolvedValueOnce(result(44.68, 34.39, ['street_address'], 'Другой город'))
    .mockResolvedValueOnce(result(45.1, 33.6, ['locality'], 'Тестовое'));
  render(<GoogleAccountMap address="с. Тестовое, ул. Примерная 10" />);
  await ready();
  expect(geocode).toHaveBeenCalledTimes(2);
  expect(geocode).toHaveBeenLastCalledWith(expect.objectContaining({ address: 'Республика Крым, Тестовое' }));
  expect(setCenter).not.toHaveBeenCalled();
  expect(setMap).toHaveBeenCalledTimes(1);
  expect(setZoom).not.toHaveBeenCalled();
  expect(screen.getByRole('status')).toHaveTextContent('точный дом не найден');
});

it('does not pin another town even when both geocoder attempts return it', async () => {
  geocode.mockResolvedValue(result(44.68, 34.39, ['street_address'], 'Другой город'));
  render(<GoogleAccountMap address="с. Тестовое, ул. Примерная 10" />);
  await ready();
  expect(geocode).toHaveBeenCalledTimes(2);
  expect(setMap).not.toHaveBeenCalled();
  expect(screen.getByRole('status')).toHaveTextContent('Не удалось найти адрес');
});

it('restores the dark palette and keeps geographic labels and place icons', async () => {
  render(<GoogleAccountMap address={null} />);
  await ready();
  expect(mapOptions).toHaveBeenCalledWith(expect.objectContaining({
    backgroundColor: '#192f65',
    styles: expect.arrayContaining([
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#192f65' }] },
      { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#316b56' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#e4ebf3' }] },
    ]),
  }));
  expect(mapOptions.mock.calls[0][0].styles).not.toEqual(expect.arrayContaining([
    expect.objectContaining({ stylers: [{ visibility: 'off' }] }),
  ]));
});

it('fits a newly visible/resized map once and keeps zoom stable during tile loads and account switches', async () => {
  mapSize = { width: 0, height: 0 };
  const view = render(<GoogleAccountMap address={null} />);
  await ready();
  expect(moveCamera).not.toHaveBeenCalled();
  mapSize = { width: 360, height: 280 };
  act(() => onResize());
  expect(moveCamera).toHaveBeenCalledTimes(1);
  act(() => onResize());
  await ready();
  view.rerender(<GoogleAccountMap address="с. Тестовое, ул. Примерная 10" />);
  await act(async () => {});
  expect(moveCamera).toHaveBeenCalledTimes(1);
  expect(setZoom).not.toHaveBeenCalled();
  expect(setCenter).not.toHaveBeenCalled();
  mapSize = { width: 600, height: 320 };
  act(() => onResize());
  expect(moveCamera).toHaveBeenCalledTimes(2);
  view.unmount();
  expect(disconnect).toHaveBeenCalledTimes(1);
});

it('matches the selected screenshot framing at the reference panel size', async () => {
  mapSize = { width: 404, height: 338 };
  render(<GoogleAccountMap address={null} />);
  await ready();
  expect(moveCamera).toHaveBeenLastCalledWith({ center: { lat: 45.266614, lng: 34.520339 }, zoom: 7 });
  expect(mapOptions).toHaveBeenCalledWith(expect.objectContaining({ isFractionalZoomEnabled: true }));
});
