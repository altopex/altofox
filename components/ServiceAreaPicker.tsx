"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  findCityByName,
  findCitiesWithinRadius,
  findCitiesByCounty,
  getCountiesForState,
  getAvailableStates,
  searchCities,
  CityData,
  US_CITIES,
} from "../lib/data/us-cities";
import { LeafletRadiusMap, MapCityPoint } from "./LeafletRadiusMap";
import {
  MapPin,
  Compass,
  Building,
  Search,
  Check,
  X,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  Edit3,
} from "lucide-react";
import { BRAND } from "@/config/brand";

export interface SelectedServiceCity {
  city: string;
  stateId: string;
  county: string;
  lat: number;
  lng: number;
  population?: number;
  distanceOffset?: string;
  distanceMiles?: number;
  slug?: string;
  localNotes?: string;
}

interface ServiceAreaPickerProps {
  businessCity: string;
  businessState: string;
  businessName: string;
  mainService: string;
  servicesList: string[];
  selectedCities: SelectedServiceCity[];
  onSelectedCitiesChange: (cities: SelectedServiceCity[]) => void;
  createSeparateServiceLocationPages: boolean;
  onCreateSeparateServiceLocationPagesChange: (val: boolean) => void;
  confirmedServesAreas: boolean;
  onConfirmedServesAreasChange: (val: boolean) => void;
}

export function ServiceAreaPicker({
  businessCity,
  businessState,
  businessName,
  mainService,
  servicesList,
  selectedCities,
  onSelectedCitiesChange,
  createSeparateServiceLocationPages,
  onCreateSeparateServiceLocationPagesChange,
  confirmedServesAreas,
  onConfirmedServesAreasChange,
}: ServiceAreaPickerProps) {
  const [activeTab, setActiveTab] = useState<"radius" | "county" | "manual">("radius");
  const [radiusMiles, setRadiusMiles] = useState<number>(25);

  // County selection state
  const availableStates = useMemo(() => getAvailableStates(), []);
  const [selectedState, setSelectedState] = useState<string>(businessState || "TX");
  const countiesForState = useMemo(() => getCountiesForState(selectedState), [selectedState]);
  const [selectedCounty, setSelectedCounty] = useState<string>(countiesForState[0] || "Dallas");

  // Manual autocomplete search
  const [manualQuery, setManualQuery] = useState("");
  const searchResults = useMemo(() => searchCities(manualQuery, 8), [manualQuery]);

  // Expanded city notes accordion
  const [expandedNotesCity, setExpandedNotesCity] = useState<string | null>(null);

  // Identify central business coordinates
  const originCity = useMemo(() => {
    const found = findCityByName(businessCity, businessState);
    if (found) return found;
    // Fallback: look for Dallas or first city
    return US_CITIES[0];
  }, [businessCity, businessState]);

  // Cities found within radius
  const radiusCities = useMemo(() => {
    return findCitiesWithinRadius(originCity.lat, originCity.lng, radiusMiles);
  }, [originCity, radiusMiles]);

  // Cities found within selected county
  const countyCities = useMemo(() => {
    return findCitiesByCounty(selectedState, selectedCounty);
  }, [selectedState, selectedCounty]);

  // Check if a city is currently selected
  const isCitySelected = (city: string, stateId: string) => {
    return selectedCities.some(
      (c) => c.city.toLowerCase() === city.toLowerCase() && c.stateId.toUpperCase() === stateId.toUpperCase()
    );
  };

  // Toggle selection of a city
  const toggleCity = (cityData: CityData, distanceMiles?: number, distanceOffset?: string) => {
    const exists = isCitySelected(cityData.city, cityData.stateId);
    if (exists) {
      onSelectedCitiesChange(
        selectedCities.filter(
          (c) => !(c.city.toLowerCase() === cityData.city.toLowerCase() && c.stateId.toUpperCase() === cityData.stateId.toUpperCase())
        )
      );
    } else {
      if (selectedCities.length >= 100) {
        alert("Hard limit of 100 service area pages reached to comply with Google quality policies.");
        return;
      }
      const tradeSlug = mainService.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const citySlug = cityData.city.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const defaultSlug = `${tradeSlug}-${citySlug}-${cityData.stateId.toLowerCase()}.html`;

      const newCity: SelectedServiceCity = {
        city: cityData.city,
        stateId: cityData.stateId,
        county: cityData.county,
        lat: cityData.lat,
        lng: cityData.lng,
        population: cityData.population,
        distanceMiles: distanceMiles,
        distanceOffset: distanceOffset || (distanceMiles ? `${distanceMiles} miles from hub` : undefined),
        slug: defaultSlug,
        localNotes: "",
      };
      onSelectedCitiesChange([...selectedCities, newCity]);
    }
  };

  // Bulk actions
  const selectAllCurrent = (citiesToSelect: CityData[]) => {
    const toAdd: SelectedServiceCity[] = [];
    const tradeSlug = mainService.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    for (const c of citiesToSelect) {
      if (!isCitySelected(c.city, c.stateId)) {
        if (selectedCities.length + toAdd.length >= 100) break;
        const citySlug = c.city.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        toAdd.push({
          city: c.city,
          stateId: c.stateId,
          county: c.county,
          lat: c.lat,
          lng: c.lng,
          population: c.population,
          slug: `${tradeSlug}-${citySlug}-${c.stateId.toLowerCase()}.html`,
          localNotes: "",
        });
      }
    }
    onSelectedCitiesChange([...selectedCities, ...toAdd]);
  };

  const selectTop10Population = (citiesToPick: CityData[]) => {
    const sorted = [...citiesToPick].sort((a, b) => b.population - a.population).slice(0, 10);
    selectAllCurrent(sorted);
  };

  const clearAllSelected = () => {
    onSelectedCitiesChange([]);
  };

  // Map Points
  const mapPoints: MapCityPoint[] = useMemo(() => {
    const list: MapCityPoint[] = [];

    // Add selected cities
    selectedCities.forEach((c) => {
      list.push({
        city: c.city,
        stateId: c.stateId,
        lat: c.lat,
        lng: c.lng,
        distanceMiles: c.distanceMiles,
        selected: true,
      });
    });

    // Add unselected radius candidates
    if (activeTab === "radius") {
      radiusCities.slice(0, 25).forEach((c) => {
        if (!selectedCities.some((sc) => sc.city === c.city && sc.stateId === c.stateId)) {
          list.push({
            city: c.city,
            stateId: c.stateId,
            lat: c.lat,
            lng: c.lng,
            distanceMiles: c.distanceMiles,
            selected: false,
          });
        }
      });
    }

    return list;
  }, [selectedCities, radiusCities, activeTab]);

  // Compute total location pages
  const totalPagesCount = useMemo(() => {
    const baseCityPages = selectedCities.length;
    if (createSeparateServiceLocationPages && servicesList.length > 0) {
      return baseCityPages * servicesList.length;
    }
    return baseCityPages;
  }, [selectedCities.length, createSeparateServiceLocationPages, servicesList.length]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>Service Areas &amp; City Page Builder</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Google Doorway-Safe
            </span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Select regions and neighboring cities where your technicians travel. {BRAND.name} generates unique local pages with regional context.
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("radius")}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
            activeTab === "radius"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>1. By Radius ({radiusMiles} mi)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("county")}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
            activeTab === "county"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>2. By County</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
            activeTab === "manual"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>3. Manual Search</span>
        </button>
      </div>

      {/* Interactive Map Preview */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-600 px-1">
          <span className="font-semibold flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              Central Hub: <strong>{originCity.city}, {originCity.stateId}</strong>
            </span>
          </span>
          <span className="text-[11px] text-slate-500">
            OpenStreetMap Tiles • Leaflet Map
          </span>
        </div>

        <LeafletRadiusMap
          centerLat={originCity.lat}
          centerLng={originCity.lng}
          radiusMiles={radiusMiles}
          businessName={businessName || "My Business"}
          cities={mapPoints}
          onSelectCity={(c, s) => {
            const found = findCityByName(c, s);
            if (found) toggleCity(found);
          }}
        />
      </div>

      {/* TAB 1: BY RADIUS */}
      {activeTab === "radius" && (
        <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-900">
                Service Radius: <span className="text-indigo-600 font-extrabold">{radiusMiles} Miles</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Shows all incorporated cities and suburbs within {radiusMiles} miles of {originCity.city}.
              </p>
            </div>
            <div className="w-full sm:w-64">
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>5 mi</span>
                <span>25 mi</span>
                <span>50 mi</span>
                <span>100 mi</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
            <span className="text-xs font-semibold text-slate-700">
              Found {radiusCities.length} cities within {radiusMiles} miles
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => selectTop10Population(radiusCities)}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition"
              >
                Top 10 by Population
              </button>
              <button
                type="button"
                onClick={() => selectAllCurrent(radiusCities)}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 transition"
              >
                Select All ({radiusCities.length})
              </button>
              <button
                type="button"
                onClick={clearAllSelected}
                className="px-2.5 py-1 text-xs font-semibold rounded text-slate-500 hover:text-red-600 transition"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Cities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
            {radiusCities.map((c) => {
              const selected = isCitySelected(c.city, c.stateId);
              return (
                <div
                  key={`${c.city}-${c.stateId}`}
                  onClick={() => toggleCity(c, c.distanceMiles, c.formattedOffset)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex items-center justify-between ${
                    selected
                      ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-800"
                  }`}
                >
                  <div className="truncate">
                    <span className="text-xs block truncate">{c.city}, {c.stateId}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {c.distanceMiles} mi • Pop. {c.population ? c.population.toLocaleString() : "N/A"}
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ml-2 ${
                      selected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                    }`}
                  >
                    {selected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BY COUNTY */}
      {activeTab === "county" && (
        <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">State</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  const newCounties = getCountiesForState(e.target.value);
                  setSelectedCounty(newCounties[0] || "");
                }}
                className="input-base text-xs cursor-pointer bg-white"
              >
                {availableStates.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">County</label>
              <select
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="input-base text-xs cursor-pointer bg-white"
              >
                {countiesForState.map((county) => (
                  <option key={county} value={county}>
                    {county} County
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-xs font-semibold text-slate-700">
              {countyCities.length} cities in {selectedCounty} County
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => selectAllCurrent(countyCities)}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 transition"
              >
                Select All in County
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
            {countyCities.map((c) => {
              const selected = isCitySelected(c.city, c.stateId);
              return (
                <div
                  key={`${c.city}-${c.stateId}`}
                  onClick={() => toggleCity(c)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex items-center justify-between ${
                    selected
                      ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-800"
                  }`}
                >
                  <div className="truncate">
                    <span className="text-xs block truncate">{c.city}, {c.stateId}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Pop. {c.population ? c.population.toLocaleString() : "N/A"}
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ml-2 ${
                      selected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                    }`}
                  >
                    {selected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MANUAL AUTOCOMPLETE */}
      {activeTab === "manual" && (
        <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Type City Name or ZIP Code
            </label>
            <input
              type="text"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder="e.g. Frisco, McKinney, 75034"
              className="input-base text-xs bg-white"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-600">Matching Cities:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchResults.map((c) => {
                  const selected = isCitySelected(c.city, c.stateId);
                  return (
                    <div
                      key={`${c.city}-${c.stateId}`}
                      onClick={() => toggleCity(c)}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex items-center justify-between ${
                        selected
                          ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-800"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">{c.city}, {c.stateId}</span>
                        <span className="text-[10px] text-slate-500">
                          {c.county} County • Pop. {c.population?.toLocaleString()}
                        </span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          selected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {selected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SELECTED CITIES MANAGER & LOCAL NOTES */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900">
              Selected Service Areas ({selectedCities.length} Cities)
            </h3>
          </div>
          {selectedCities.length > 0 && (
            <button
              type="button"
              onClick={clearAllSelected}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Clear All
            </button>
          )}
        </div>

        {selectedCities.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center italic">
            No service areas selected yet. Use the tabs above to select nearby cities and suburbs.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {selectedCities.map((sc, idx) => {
                const isExpanded = expandedNotesCity === sc.city;
                return (
                  <div
                    key={`${sc.city}-${sc.stateId}`}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate">
                        {sc.city}, {sc.stateId}
                      </span>
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpandedNotesCity(isExpanded ? null : sc.city)}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 p-0.5"
                          title="Add local notes for this city"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onSelectedCitiesChange(selectedCities.filter((_, i) => i !== idx))
                          }
                          className="text-slate-400 hover:text-red-600 p-0.5"
                          title="Remove city"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      {sc.slug || `plumber-${sc.city.toLowerCase()}-${sc.stateId.toLowerCase()}.html`}
                    </div>

                    {sc.localNotes && (
                      <p className="text-[10px] text-amber-800 bg-amber-50 p-1 rounded italic truncate">
                        Note: {sc.localNotes}
                      </p>
                    )}

                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-200 space-y-1">
                        <label className="text-[10px] font-bold text-slate-700 block">
                          Local Context Notes (Sent to AI)
                        </label>
                        <input
                          type="text"
                          value={sc.localNotes || ""}
                          onChange={(e) => {
                            const updated = [...selectedCities];
                            updated[idx].localNotes = e.target.value;
                            onSelectedCitiesChange(updated);
                          }}
                          placeholder="e.g. older mid-century homes, frequent hard water issues"
                          className="w-full text-[11px] p-1.5 border border-slate-300 rounded bg-white"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Multi-Service Matrix Toggle */}
        <div className="pt-3 border-t border-slate-200 space-y-2">
          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={createSeparateServiceLocationPages}
              onChange={(e) => onCreateSeparateServiceLocationPagesChange(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-900">
                Service × Location Matrix (Create pages for each service in each city)
              </span>
              <p className="text-[11px] text-slate-500">
                Generates specific pages like <code>drain-cleaning-beaverton-or.html</code>. Increases page count significantly.
              </p>
            </div>
          </label>
        </div>

        {/* Live Counter & Soft Warning */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              {totalPagesCount}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900">
                {totalPagesCount} location {totalPagesCount === 1 ? "page" : "pages"} will be created
              </span>
              <p className="text-[10px] text-slate-500">
                Plus a unified Service Areas Hub (<code>service-areas.html</code>) linking to each city.
              </p>
            </div>
          </div>

          {totalPagesCount > 25 && (
            <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-[11px] text-amber-900 max-w-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Soft Limit Warning:</strong> Only create pages for areas you truly serve. Large numbers of similar city pages can be penalized by Google.
              </span>
            </div>
          )}
        </div>

        {/* Confirmation Checkbox */}
        <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-950">
          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmedServesAreas}
              onChange={(e) => onConfirmedServesAreasChange(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs font-bold">
              I confirm my business actively dispatches to and serves these selected service areas.
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
