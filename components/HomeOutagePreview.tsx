"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as VectorMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { GoogleOutageMap } from "./GoogleOutageMap";
const useGoogleMap = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const incidents = [
  { id: "repair", place: "с. Лесновка", address: "ул. Механизаторов", status: "Аварийные работы", color: "#e05a38", coords: [45.131, 33.602] as [number, number], description: "Пример сообщения: ремонт участка водопровода. Адреса и сроки приведены только для демонстрации.", estimate: "Срок восстановления уточняется" },
  { id: "planned", place: "г. Саки", address: "ул. Советская", status: "Плановые работы", color: "#2563eb", coords: [45.134, 33.577] as [number, number], description: "Пример сообщения: плановое обслуживание сети. Это не сообщение о реальном отключении.", estimate: "Пример срока: до 17:00" },
  { id: "pressure", place: "с. Орехово", address: "ул. 8 Марта", status: "Снижение давления", color: "#ca8a04", coords: [45.112, 33.629] as [number, number], description: "Пример сообщения: пониженное давление на время работ. Границы отключения ещё не подтверждены.", estimate: "Срок восстановления уточняется" },
];

export function HomeOutagePreview({ hero = false, stacked = false }: { hero?: boolean; stacked?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<VectorMap | null>(null);
  const pins = useRef<Record<string, Marker>>({});
  const [selected, setSelected] = useState(incidents[0].id);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);
  const visible = incidents;
  const active = visible.find(item => item.id === selected) ?? visible[0];

  useEffect(() => {
    if (useGoogleMap) return;
    let disposed = false;
    let resize: ResizeObserver | undefined;
    const timeout = setTimeout(() => { if (!disposed) setError(true); }, 15000);
    import("maplibre-gl").then(M => {
      if (disposed || !host.current) return;
      const instance = new M.Map({
        container: host.current,
        style: "https://tiles.openfreemap.org/styles/positron",
        center: [33.599, 45.123], zoom: 11.5,
        scrollZoom: false, dragRotate: false, pitchWithRotate: false,
        attributionControl: false,
      });
      map.current = instance;
      instance.addControl(new M.NavigationControl({ showCompass: false }), "top-right");
      // Source credits are exposed by the accessible disclosure below the map.
      instance.on("error", () => { if (!disposed) setTilesFailed(true); });
      instance.on("load", () => {
        if (disposed) return;
        clearTimeout(timeout);
        // A restrained vector palette; local-language labels wherever available.
        for (const layer of instance.getStyle().layers) {
          if (layer.type === "background") instance.setPaintProperty(layer.id, "background-color", "#dce1e5");
          if (layer.type === "fill" && layer["source-layer"] === "water") instance.setPaintProperty(layer.id, "fill-color", "#96bacd");
          if (layer.type === "fill" && layer["source-layer"] === "landcover") instance.setPaintProperty(layer.id, "fill-color", "#cbd6cf");
          if (layer.type === "fill" && layer["source-layer"] === "landuse") instance.setPaintProperty(layer.id, "fill-color", "#d0d6d9");
          if (layer.type === "fill" && layer["source-layer"] === "building") instance.setPaintProperty(layer.id, "fill-color", "#b9c3cb");
          if (layer.type === "symbol" && layer.layout?.["text-field"]) instance.setLayoutProperty(layer.id, "text-field", ["coalesce", ["get", "name:ru"], ["get", "name"]]);
        }
        setError(false);
        setReady(true);
      });
      incidents.forEach(item => {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("aria-label", `${item.place}: ${item.status}`);
        button.style.cssText = `width:26px;height:26px;border:3px solid white;border-radius:50%;background:${item.color};box-shadow:0 2px 8px #0f172a30;cursor:pointer;`;
        button.addEventListener("click", () => setSelected(item.id));
        pins.current[item.id] = new M.Marker({ element: button }).setLngLat([item.coords[1], item.coords[0]]).addTo(instance);
      });
      resize = new ResizeObserver(() => instance.resize());
      resize.observe(host.current);
    }).catch(() => { if (!disposed) { clearTimeout(timeout); setError(true); } });
    return () => { disposed = true; clearTimeout(timeout); resize?.disconnect(); Object.values(pins.current).forEach(pin => pin.remove()); map.current?.remove(); map.current = null; pins.current = {}; };
  }, []);

  useEffect(() => {
    if (!ready || !map.current) return;
    const instance = map.current;
    incidents.forEach(item => {
      const pin = pins.current[item.id];
      if (!pin) return;
      const element = pin.getElement();
      element.style.display = visible.some(entry => entry.id === item.id) ? "" : "none";
      const size = active?.id === item.id ? "30px" : "22px";
      element.style.width = size;
      element.style.height = size;
      element.setAttribute("aria-pressed", String(active?.id === item.id));
    });
    if (active) instance.jumpTo({ center: [active.coords[1], active.coords[0]] });
  }, [selected, ready]);

  return <section aria-labelledby="outage-title" className={`flex min-w-0 flex-col text-slate-900 ${hero ? "h-full" : ""}`}>
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className={`relative isolate bg-slate-200 ${stacked ? "aspect-square w-full shrink-0" : hero ? "min-h-0 flex-1" : "min-h-[320px] flex-1"}`}>
        <div className="absolute left-0 top-0 z-20">
          <h2 id="outage-title" title="Демонстрационная карта: реальные сообщения об отключениях пока не подключены" className="bg-slate-950/70 px-3 py-2 text-sm font-semibold tracking-tight text-white shadow-sm backdrop-blur-md">Карта отключений</h2>
        </div>
        {useGoogleMap ? <GoogleOutageMap incidents={incidents} visibleIds={visible.map(item => item.id)} activeId={active?.id} onSelect={setSelected} /> : <>
        <div ref={host} role="region" aria-label="Карта с тестовыми отметками отключений" className="maplibregl-map z-0" style={{ position: "absolute", inset: 0, overflow: "hidden", fontSize: 12 }} />
        <details className="absolute bottom-2 right-2 z-10 max-w-[calc(100%-1rem)] border border-slate-300 bg-white/95 px-2 py-1 text-[11px] text-slate-600 shadow-sm">
          <summary aria-label="Источники картографических данных" title="Источники карты" className="cursor-pointer list-none text-right font-semibold">ⓘ</summary>
          <div className="pt-1"><a className="underline" href="https://openfreemap.org/">OpenFreeMap</a> · <a className="underline" href="https://www.openmaptiles.org/">© OpenMapTiles</a> · <a className="underline" href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a></div>
        </details>
        {!ready && <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100 px-6 text-center text-sm text-slate-500">{error ? "Карта недоступна. Сообщения доступны в списке ниже." : "Загружаем карту…"}</div>}
        {tilesFailed && <p className="pointer-events-none absolute bottom-6 left-3 right-3 z-10 bg-white/95 p-2 text-xs text-slate-600">Не удалось загрузить часть карты. Список сообщений доступен ниже.</p>}
        </>}
      </div>
      {stacked && <div className="flex items-center justify-between border-t border-slate-200 px-5 pt-5 pb-3"><h3 className="text-base font-semibold">Текущие отключения</h3><span className="text-[10px] text-slate-400">Демонстрация</span></div>}
      <div className={stacked ? "grid shrink-0 items-stretch px-3 pb-3" : "grid shrink-0 items-stretch border-t border-slate-200"} style={{ gridTemplateColumns: stacked ? 'minmax(0, 1fr)' : `repeat(${Math.max(visible.length, 1)}, minmax(0, 1fr))` }} aria-label="Сообщения об отключениях">
        {visible.map(item => <button key={item.id} type="button" onClick={() => setSelected(item.id)} aria-pressed={active?.id === item.id} className={`min-w-0 text-left text-xs focus-visible:outline-blue-600 ${stacked ? "border-l-2 border-b border-b-slate-100 px-3 py-3" : "border-b-2 px-3 py-2"} ${active?.id === item.id ? "border-blue-600 bg-blue-50" : "border-transparent hover:bg-slate-50"}`}><span className="mb-1 flex items-center gap-1.5 font-semibold text-slate-800"><span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />{item.place}{stacked && <span className="ml-auto font-normal text-slate-400">↗</span>}</span><span className="text-slate-500">{item.status}</span>{stacked && <span className="ml-2 text-[10px] text-slate-400">· {item.estimate}</span>}</button>)}
        {!visible.length && <p role="status" className="col-span-3 p-4 text-sm text-slate-500">В тестовых сообщениях ничего не найдено. Это не означает, что по адресу нет отключений.</p>}
      </div>
    </div>
  </section>;
}
