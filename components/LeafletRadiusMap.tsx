"use client";

import React, { useEffect, useRef, useState } from "react";

export interface MapCityPoint {
  city: string;
  stateId: string;
  lat: number;
  lng: number;
  distanceMiles?: number;
  selected?: boolean;
}

interface LeafletRadiusMapProps {
  centerLat: number;
  centerLng: number;
  radiusMiles: number;
  businessName: string;
  cities: MapCityPoint[];
  onSelectCity?: (city: string, stateId: string) => void;
  className?: string;
}

export function LeafletRadiusMap({
  centerLat,
  centerLng,
  radiusMiles,
  businessName,
  cities,
  onSelectCity,
  className = "h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 relative",
}: LeafletRadiusMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet dynamically via CDN link & script to avoid SSR issues
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    // Load CSS
    const linkId = "leaflet-css-cdn";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load JS
    const scriptId = "leaflet-js-cdn";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }
  }, []);

  // Initialize and update Map when Leaflet is available
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Check valid coordinates
    const safeLat = isNaN(centerLat) || centerLat === 0 ? 32.7767 : centerLat;
    const safeLng = isNaN(centerLng) || centerLng === 0 ? -96.797 : centerLng;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [safeLat, safeLng],
        zoom: 9,
        scrollWheelZoom: false,
      });

      // OpenStreetMap Tiles (Free, No API key)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    map.setView([safeLat, safeLng], radiusMiles > 40 ? 8 : radiusMiles > 20 ? 9 : 10);

    // 1. Business Location Marker (Indigo)
    const businessIcon = L.divIcon({
      className: "custom-biz-pin",
      html: `<div style="background-color: #4F46E5; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    L.marker([safeLat, safeLng], { icon: businessIcon })
      .bindPopup(`<strong>${businessName || "Business Location"}</strong><br/><span style="font-size:11px;color:#64748B;">Central Hub</span>`)
      .addTo(layerGroup);

    // 2. Service Area Radius Circle
    const radiusMeters = radiusMiles * 1609.34;
    L.circle([safeLat, safeLng], {
      radius: radiusMeters,
      color: "#4F46E5",
      fillColor: "#4F46E5",
      fillOpacity: 0.1,
      weight: 2,
      dashArray: "4, 6",
    }).addTo(layerGroup);

    // 3. Selected and Available Cities Markers
    cities.forEach((c) => {
      const isSelected = c.selected !== false;
      const markerColor = isSelected ? "#10B981" : "#94A3B8";

      const cityIcon = L.divIcon({
        className: "custom-city-pin",
        html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const marker = L.marker([c.lat, c.lng], { icon: cityIcon }).addTo(layerGroup);

      const popupContent = document.createElement("div");
      popupContent.innerHTML = `
        <div style="font-size:12px; font-family:sans-serif;">
          <strong>${c.city}, ${c.stateId}</strong>
          ${c.distanceMiles !== undefined ? `<br/><span style="color:#64748B;font-size:11px;">${c.distanceMiles} miles from hub</span>` : ""}
          <br/>
          <button style="margin-top:4px; padding:2px 6px; font-size:10px; background:#EEF2FF; color:#4F46E5; border:1px solid #C7D2FE; border-radius:4px; cursor:pointer;">
            ${isSelected ? "Selected" : "Click to Select"}
          </button>
        </div>
      `;

      if (onSelectCity) {
        popupContent.querySelector("button")?.addEventListener("click", () => {
          onSelectCity(c.city, c.stateId);
        });
      }

      marker.bindPopup(popupContent);
    });
  }, [leafletLoaded, centerLat, centerLng, radiusMiles, businessName, cities, onSelectCity]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className={className}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      {!leafletLoaded && (
        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-medium">
          Loading OpenStreetMap tiles…
        </div>
      )}
    </div>
  );
}
