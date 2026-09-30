import React, { useState, useEffect, useRef } from 'react';
import { PredictionRow } from '../types';
import { Layers, Bug, CheckCircle2 } from 'lucide-react';

interface MapViewProps {
  predictions: PredictionRow[];
  selectedPointId?: string;
  onSelectPoint?: (pointId: string) => void;
  variable?: 'tmax' | 'tmin' | 'rain';
  setVariable?: (v: 'tmax' | 'tmin' | 'rain') => void;
  selectedDate?: string;
  height?: string;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyBt5d5QGaz2WVuq-Vkx-rAwoFA7CkBpTuk';

export const MapView: React.FC<MapViewProps> = ({
  predictions,
  selectedPointId,
  onSelectPoint,
  variable = 'rain',
  setVariable,
  selectedDate,
  height = '520px'
}) => {
  const [internalVar, setInternalVar] = useState<'tmax' | 'tmin' | 'rain'>(variable);
  const [statistic, setStatistic] = useState<'p10' | 'p50' | 'p90'>('p50');
  const [showDebug, setShowDebug] = useState<boolean>(true);

  const activeVar = setVariable ? variable : internalVar;

  const handleVarChange = (v: 'tmax' | 'tmin' | 'rain') => {
    if (setVariable) setVariable(v);
    else setInternalVar(v);
  };

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapObjRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const activeInfoWindowRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // Parse numerical min/max lat/lon bounds for diagnostic verification
  const validPoints = predictions.filter(p => Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon)));
  const lats = validPoints.map(p => Number(p.lat));
  const lons = validPoints.map(p => Number(p.lon));

  const minLat = lats.length > 0 ? Math.min(...lats) : 0;
  const maxLat = lats.length > 0 ? Math.max(...lats) : 0;
  const minLon = lons.length > 0 ? Math.min(...lons) : 0;
  const maxLon = lons.length > 0 ? Math.max(...lons) : 0;
  const samplePoints = validPoints.slice(0, 5);

  // Load Google Maps JS SDK
  useEffect(() => {
    if ((window as any).google && (window as any).google.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-js-sdk';
    if (document.getElementById(scriptId)) {
      const checkInterval = setInterval(() => {
        if ((window as any).google && (window as any).google.maps) {
          setMapLoaded(true);
          clearInterval(checkInterval);
        }
      }, 200);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps SDK');
    };
    document.head.appendChild(script);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    if (!googleMapObjRef.current) {
      const google = (window as any).google;
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 32.15, lng: 76.35 },
        zoom: 10,
        mapTypeId: 'terrain',
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
          { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b687a' }] },
          { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b687a' }] },
          { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#023e8a' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1726' }] },
          { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d8c' }] }
        ]
      });
      googleMapObjRef.current = map;
    }
  }, [mapLoaded]);

  // Dynamic Map Fit Bounds
  useEffect(() => {
    if (!mapLoaded || !googleMapObjRef.current || validPoints.length === 0) return;
    const google = (window as any).google;
    const map = googleMapObjRef.current;

    const bounds = new google.maps.LatLngBounds();
    validPoints.forEach(p => {
      bounds.extend({ lat: Number(p.lat), lng: Number(p.lon) });
    });

    map.fitBounds(bounds, { padding: 40 });
  }, [mapLoaded, predictions.length]);

  // Color & Scale helper based on selected variable & selected quantile statistic
  const getMarkerStyle = (row: PredictionRow) => {
    const isSelected = row.point_id === selectedPointId;
    const key = `${activeVar}_${statistic}` as keyof PredictionRow;
    const val = Number(row[key]) || 0;

    if (activeVar === 'rain') {
      let fillColor = '#3b82f6';
      let scale = 6;

      if (val < 2.5) {
        fillColor = '#94a3b8';
        scale = 5;
      } else if (val < 15.0) {
        fillColor = '#2563eb';
        scale = 7;
      } else {
        fillColor = '#ef4444';
        scale = 9;
      }
      return { fillColor, strokeColor: isSelected ? '#ffffff' : '#0f172a', scale: isSelected ? scale + 3 : scale, strokeWidth: isSelected ? 2.5 : 1 };
    }

    if (activeVar === 'tmax') {
      let fillColor = '#f97316';
      let scale = 6;

      if (val < 25.0) {
        fillColor = '#38bdf8';
      } else if (val < 32.0) {
        fillColor = '#f97316';
        scale = 7;
      } else {
        fillColor = '#ef4444';
        scale = 9;
      }
      return { fillColor, strokeColor: isSelected ? '#ffffff' : '#0f172a', scale: isSelected ? scale + 3 : scale, strokeWidth: isSelected ? 2.5 : 1 };
    }

    // TMIN
    let fillColor = '#38bdf8';
    let scale = 6;

    if (val < 15.0) {
      fillColor = '#0284c7';
    } else if (val < 22.0) {
      fillColor = '#2dd4bf';
      scale = 7;
    } else {
      fillColor = '#fde047';
      scale = 8;
    }
    return { fillColor, strokeColor: isSelected ? '#ffffff' : '#0f172a', scale: isSelected ? scale + 3 : scale, strokeWidth: isSelected ? 2.5 : 1 };
  };

  // Render precise Point Markers anchored exactly at Lat & Lon
  useEffect(() => {
    if (!mapLoaded || !googleMapObjRef.current) return;
    const google = (window as any).google;
    const map = googleMapObjRef.current;

    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    validPoints.forEach(row => {
      const lat = Number(row.lat);
      const lon = Number(row.lon);
      const style = getMarkerStyle(row);

      const symbol = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: style.scale,
        fillColor: style.fillColor,
        fillOpacity: 0.95,
        strokeColor: style.strokeColor,
        strokeWeight: style.strokeWidth,
      };

      const marker = new google.maps.Marker({
        position: { lat, lng: lon },
        map,
        icon: symbol,
        title: `${row.point_id} (Lat: ${lat.toFixed(4)}°, Lon: ${lon.toFixed(4)}°)`
      });

      marker.addListener('click', () => {
        if (onSelectPoint) onSelectPoint(row.point_id);

        if (activeInfoWindowRef.current) {
          activeInfoWindowRef.current.close();
        }

        const infoContent = `
          <div style="padding: 6px; min-width: 210px; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif;">
            <div style="font-weight: 800; font-size: 13px; color: #34d399; margin-bottom: 2px;">Kangra Grid Point</div>
            <hr style="border: 0; border-top: 1px solid #334155; margin: 4px 0 8px 0;" />
            <div style="font-size: 11px; line-height: 1.5; color: #cbd5e1;">
              <div><strong>Point:</strong> <span style="color: #60a5fa; font-family: monospace;">${row.point_id}</span></div>
              <div><strong>Lat:</strong> ${lat.toFixed(4)}°</div>
              <div><strong>Lon:</strong> ${lon.toFixed(4)}°</div>
              <div><strong>Date:</strong> ${row.date}</div>
              
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #334155;">
                <strong style="color: #fb923c;">TMAX:</strong><br/>
                ${row.tmax_p10.toFixed(2)} – ${row.tmax_p50.toFixed(2)} – ${row.tmax_p90.toFixed(2)} °C
              </div>
              
              <div style="margin-top: 6px;">
                <strong style="color: #38bdf8;">TMIN:</strong><br/>
                ${row.tmin_p10.toFixed(2)} – ${row.tmin_p50.toFixed(2)} – ${row.tmin_p90.toFixed(2)} °C
              </div>
              
              <div style="margin-top: 6px;">
                <strong style="color: #60a5fa;">Rainfall:</strong><br/>
                ${row.rain_p10.toFixed(2)} – ${row.rain_p50.toFixed(2)} – ${row.rain_p90.toFixed(2)} mm
              </div>
            </div>
          </div>
        `;

        const infoWindow = new google.maps.InfoWindow({
          content: infoContent,
          position: { lat, lng: lon }
        });

        infoWindow.open(map, marker);
        activeInfoWindowRef.current = infoWindow;
      });

      markersRef.current.push(marker);
    });
  }, [mapLoaded, predictions, activeVar, statistic, selectedPointId]);

  return (
    <div className="bg-white border border-[#F2D7D3] rounded-2xl overflow-hidden shadow-sm flex flex-col relative">
      {/* Map Control Header */}
      <div className="bg-[#FAF1F0] border-b border-[#E6B8B2] px-4 py-3 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#7A3F39]" />
          <span className="text-xs font-bold text-[#2D1412] uppercase tracking-wide">Spatial Forecast Map (Exact Lat/Lon Coordinates)</span>
          {selectedDate && (
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-white text-[#7A3F39] border border-[#E6B8B2]">
              {selectedDate}
            </span>
          )}
          <span className="text-xs text-[#6E4E4B]">({validPoints.length} Grid Points)</span>
        </div>

        {/* Variable & Statistic Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Statistic Pill Selector */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-[#E6B8B2] text-[11px] font-bold">
            <span className="text-[#6E4E4B] px-2 uppercase text-[10px]">Quantile:</span>
            <button
              onClick={() => setStatistic('p10')}
              className={`px-2 py-0.5 rounded-lg transition ${statistic === 'p10' ? 'bg-[#7A3F39] text-white' : 'text-[#6E4E4B] hover:text-[#2D1412]'}`}
            >
              P10
            </button>
            <button
              onClick={() => setStatistic('p50')}
              className={`px-2 py-0.5 rounded-lg transition ${statistic === 'p50' ? 'bg-[#7A3F39] text-white' : 'text-[#6E4E4B] hover:text-[#2D1412]'}`}
            >
              P50 (Median)
            </button>
            <button
              onClick={() => setStatistic('p90')}
              className={`px-2 py-0.5 rounded-lg transition ${statistic === 'p90' ? 'bg-[#7A3F39] text-white' : 'text-[#6E4E4B] hover:text-[#2D1412]'}`}
            >
              P90
            </button>
          </div>

          {/* Variable Selector */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-[#E6B8B2]">
            <button
              onClick={() => handleVarChange('rain')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${activeVar === 'rain'
                  ? 'bg-[#1565C0] text-white shadow-sm'
                  : 'text-[#6E4E4B] hover:text-[#2D1412]'
                }`}
            >
              Rainfall
            </button>
            <button
              onClick={() => handleVarChange('tmax')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition ${activeVar === 'tmax'
                  ? 'bg-[#E65100] text-white shadow-sm'
                  : 'text-[#6E4E4B] hover:text-[#2D1412]'
                }`}
            >
              TMAX
            </button>
            <button
              onClick={() => handleVarChange('tmin')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition ${activeVar === 'tmin'
                  ? 'bg-[#0277BD] text-white shadow-sm'
                  : 'text-[#6E4E4B] hover:text-[#2D1412]'
                }`}
            >
              TMIN
            </button>
          </div>

          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`p-1.5 rounded-xl border text-xs transition ${showDebug ? 'bg-[#FAF1F0] text-[#7A3F39] border-[#E6B8B2]' : 'bg-white text-[#6E4E4B] border-[#E6B8B2]'
              }`}
            title="Toggle Coordinate Diagnostic Debug Panel"
          >
            <Bug className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map canvas */}
      <div style={{ height, width: '100%' }} className="relative z-0">
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

        {/* Diagnostic Debug Panel Overlay */}
        {showDebug && (
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur border border-[#F2D7D3] rounded-xl p-3 z-[10] text-[11px] font-mono text-[#2D1412] space-y-1.5 shadow-md max-w-[280px]">
            <div className="font-bold text-[#7A3F39] border-b border-[#F2D7D3] pb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#7A3F39]" />
                Coordinate Diagnostics
              </span>
              <button onClick={() => setShowDebug(false)} className="text-[#6E4E4B] hover:text-[#2D1412]">✕</button>
            </div>
            <div>Prediction points: <strong className="text-[#2D1412]">{validPoints.length}</strong></div>
            <div>Latitude range: <strong className="text-[#7A3F39]">{minLat.toFixed(4)}° – {maxLat.toFixed(4)}° N</strong></div>
            <div>Longitude range: <strong className="text-[#7A3F39]">{minLon.toFixed(4)}° – {maxLon.toFixed(4)}° E</strong></div>
            <div className="pt-1 border-t border-[#F2D7D3] text-[10px] space-y-0.5 text-[#6E4E4B]">
              <div className="font-bold text-[#2D1412]">Sample coordinates:</div>
              {samplePoints.map(p => (
                <div key={p.point_id}>
                  {p.point_id} → lat={Number(p.lat).toFixed(2)}, lon={Number(p.lon).toFixed(2)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur border border-[#F2D7D3] rounded-xl p-3 z-[10] text-xs space-y-1.5 shadow-md max-w-[200px]">
          <div className="font-bold text-[#2D1412] border-b border-[#F2D7D3] pb-1 flex items-center justify-between">
            <span>Map Legend ({activeVar.toUpperCase()} {statistic.toUpperCase()})</span>
          </div>

          {activeVar === 'rain' && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400 inline-block"></span>
                <span className="text-[#6E4E4B]">No/Low (&lt; 2.5 mm)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                <span className="text-[#6E4E4B]">Moderate (2.5–15 mm)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                <span className="text-[#6E4E4B]">Heavy (&gt; 15 mm)</span>
              </div>
            </>
          )}

          {activeVar === 'tmax' && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-400 inline-block"></span>
                <span className="text-[#6E4E4B]">&lt; 25.0 °C</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-400 inline-block"></span>
                <span className="text-[#6E4E4B]">25.0 – 32.0 °C</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                <span className="text-[#6E4E4B]">&gt; 32.0 °C</span>
              </div>
            </>
          )}

          {activeVar === 'tmin' && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-400 inline-block"></span>
                <span className="text-[#6E4E4B]">&lt; 15.0 °C</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-400 inline-block"></span>
                <span className="text-[#6E4E4B]">15.0 – 22.0 °C</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
                <span className="text-[#6E4E4B]">&gt; 22.0 °C</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
