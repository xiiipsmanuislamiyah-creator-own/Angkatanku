import React, { useState, useCallback } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow, 
  useMap 
} from '@vis.gl/react-google-maps';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Copy, 
  Check, 
  School, 
  Layers, 
  Compass,
  RotateCcw
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCVnoiEfmJU53NLnqBYW5EMChTbGyoW9to';

// Exact coordinates for 66X6+RR6 Yayasan Pendidikan Nahdliyah Islamiyah, Trigonco Utara, Asembagus
const SCHOOL_COORDINATES = {
  lat: -7.7504625,
  lng: 114.2120156
};

const PLUS_CODE = '66X6+RR6';
const FULL_ADDRESS = 'Yayasan Pendidikan Nahdliyah Islamiyah, Trigonco Utara, Trigonco, Kec. Asembagus, Kabupaten Situbondo, Jawa Timur 68373';
const GOOGLE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${SCHOOL_COORDINATES.lat},${SCHOOL_COORDINATES.lng}`;
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${SCHOOL_COORDINATES.lat},${SCHOOL_COORDINATES.lng}`;

// Internal helper component to control map panning and view types
function MapControlPanel({ 
  mapTypeId, 
  setMapTypeId 
}: { 
  mapTypeId: string; 
  setMapTypeId: (type: string) => void; 
}) {
  const map = useMap();
  const [isInStreetView, setIsInStreetView] = useState(false);

  // Monitor street view panorama visibility so users can easily exit back to satellite/roadmap
  React.useEffect(() => {
    if (!map) return;
    try {
      const streetView = map.getStreetView();
      if (!streetView) return;

      const listener = streetView.addListener('visible_changed', () => {
        setIsInStreetView(Boolean(streetView.getVisible()));
      });

      return () => {
        if (window.google?.maps?.event) {
          google.maps.event.removeListener(listener);
        }
      };
    } catch (e) {
      console.warn('Street view listener error:', e);
    }
  }, [map]);

  const handleExitStreetView = useCallback(() => {
    if (map) {
      try {
        const streetView = map.getStreetView();
        if (streetView) {
          streetView.setVisible(false);
        }
      } catch (e) {
        console.warn('Error closing street view:', e);
      }
      setIsInStreetView(false);
      map.setMapTypeId('hybrid');
      setMapTypeId('hybrid');
      map.panTo(SCHOOL_COORDINATES);
      map.setZoom(17);
    }
  }, [map, setMapTypeId]);

  const handleRecenter = useCallback(() => {
    if (map) {
      try {
        const streetView = map.getStreetView();
        if (streetView && streetView.getVisible()) {
          streetView.setVisible(false);
          setIsInStreetView(false);
        }
      } catch {
        // ignore
      }
      map.panTo(SCHOOL_COORDINATES);
      map.setZoom(17);
    }
  }, [map]);

  const toggleMapType = useCallback(() => {
    const nextType = mapTypeId === 'roadmap' ? 'hybrid' : 'roadmap';
    setMapTypeId(nextType);
    if (map) {
      try {
        const streetView = map.getStreetView();
        if (streetView && streetView.getVisible()) {
          streetView.setVisible(false);
          setIsInStreetView(false);
        }
      } catch {
        // ignore
      }
      map.setMapTypeId(nextType);
    }
  }, [map, mapTypeId, setMapTypeId]);

  return (
    <>
      {/* Prominent Exit Button when in Street View (Mode Jalan Kaki) */}
      {isInStreetView && (
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={handleExitStreetView}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl text-xs font-bold transition-all cursor-pointer ring-2 ring-white/90 animate-bounce"
            title="Keluar dari mode jalan kaki dan kembali ke tampilan satelit sekolah"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Kembali ke Mode Satelit</span>
          </button>
        </div>
      )}

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={toggleMapType}
          type="button"
          title="Ganti Tampilan Satelit / Peta"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 shadow-lg text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-600 transition-all cursor-pointer"
        >
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>{mapTypeId === 'roadmap' ? 'Mode Satelit' : 'Mode Peta'}</span>
        </button>

        <button
          onClick={handleRecenter}
          type="button"
          title="Fokuskan ke Sekolah"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 shadow-lg text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-600 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-emerald-600" />
          <span>Pusatkan</span>
        </button>
      </div>
    </>
  );
}

export default function SchoolLocationMap() {
  const [infoOpen, setInfoOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [mapTypeId, setMapTypeId] = useState<string>('roadmap');

  const copyAddress = () => {
    navigator.clipboard.writeText(`${FULL_ADDRESS} (Plus Code: ${PLUS_CODE})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="lokasi" className="py-20 md:py-28 bg-[#FCFCF8] relative z-20 border-t border-black/5">
      <div className="max-w-7xl mx-auto px-5 sm:px-10 lg:px-20">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <span className="font-sans text-xs tracking-widest font-extrabold text-[#B89B5E] uppercase mb-3 block">
              04. Titik Temu &amp; Koordinat
            </span>
            <h2 className="font-['Playfair_Display',serif] text-3xl sm:text-4xl md:text-5xl text-[#121212] font-bold leading-tight">
              Satu Titik, Sejuta Kenangan di MA NU Islamiyah.
            </h2>
            <p className="font-sans text-[#121212]/70 text-sm sm:text-base mt-4 leading-relaxed font-normal">
              Lokasi fisik tempat kita berkumpul setiap fajar, menimba ilmu, bersenda gurau di pelataran, hingga melangkah bersama sebagai keluarga besar XII IPS 1 &amp; 2.
            </p>
          </div>

          {/* Quick Direct Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-md hover:shadow-emerald-600/30 cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Petunjuk Arah</span>
            </a>
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black/5 hover:bg-black/10 text-[#121212] border border-black/15 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-[#B89B5E]" />
              <span>Buka Google Maps</span>
            </a>
          </div>
        </div>

        {/* Main Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Interactive Google Map */}
          <div className="lg:col-span-8 rounded-3xl overflow-hidden border border-black/10 shadow-xl bg-white relative min-h-[460px] md:min-h-[540px] flex flex-col">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
              <div className="relative w-full h-full min-h-[460px] md:min-h-[540px]">
                <Map
                  defaultCenter={SCHOOL_COORDINATES}
                  defaultZoom={17}
                  mapId="DEMO_MAP_ID"
                  gestureHandling="cooperative"
                  disableDefaultUI={false}
                  zoomControl={true}
                  mapTypeControl={false}
                  streetViewControl={true}
                  fullscreenControl={true}
                  className="w-full h-full"
                >
                  <MapControlPanel 
                    mapTypeId={mapTypeId} 
                    setMapTypeId={setMapTypeId} 
                  />

                  {/* Marker for School */}
                  <AdvancedMarker
                    position={SCHOOL_COORDINATES}
                    onClick={() => setInfoOpen(true)}
                    title="Yayasan Pendidikan Nahdliyah Islamiyah"
                  >
                    <Pin
                      background="#059669"
                      borderColor="#064e3b"
                      glyphColor="#ffffff"
                      scale={1.2}
                    />
                  </AdvancedMarker>

                  {/* Info Window */}
                  {infoOpen && (
                    <InfoWindow
                      position={SCHOOL_COORDINATES}
                      onCloseClick={() => setInfoOpen(false)}
                      maxWidth={320}
                    >
                      <div className="p-2 text-left font-sans">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600">
                            Pusat Kegiatan Sekolah
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
                          Yayasan Pendidikan Nahdliyah Islamiyah
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          MA NU Islamiyah Asembagus &bull; Ruang Kelas XII IPS 1 &amp; XII IPS 2
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                          <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                            {PLUS_CODE}
                          </span>
                          <a
                            href={DIRECTIONS_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                          >
                            <span>Rute Ke Sini</span>
                            <Navigation className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </div>
            </APIProvider>

            {/* Bottom bar inside Map Container */}
            <div className="bg-[#121212] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-white/80">
                <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono">Lat: -7.75046 &bull; Lng: 114.21202</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-[#B89B5E]">
                <span>Plus Code:</span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-white font-bold">{PLUS_CODE}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Location Details & School Card */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-6">
            
            {/* Card 1: Detail Alamat Resmi */}
            <div className="bg-white p-7 rounded-3xl border border-black/10 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#B89B5E] font-bold">
                    Pangkalan Almamater
                  </span>
                  <h3 className="font-bold text-base text-slate-900 font-display">
                    MA NU Islamiyah
                  </h3>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block mb-0.5">Alamat Lengkap:</strong>
                    <p>{FULL_ADDRESS}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <span className="text-base shrink-0">📍</span>
                  <div>
                    <strong className="text-slate-900 block mb-0.5">Plus Code Google:</strong>
                    <p className="font-mono text-emerald-700 font-semibold">{PLUS_CODE}</p>
                  </div>
                </div>
              </div>

              {/* Copy Address Button */}
              <button
                type="button"
                onClick={copyAddress}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 text-xs font-bold transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Alamat &amp; Plus Code Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Alamat Lengkap</span>
                  </>
                )}
              </button>
            </div>

            {/* Card 2: Nuansa Lingkungan & Transportasi */}
            <div className="bg-[#121212] text-white p-7 rounded-3xl border border-white/10 shadow-lg space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Suasana &amp; Kawasan</span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Berlokasi strategis di Trigonco Utara, Asembagus, kawasan madrasah dikelilingi rindangnya pepohonan dan kedamaian suasana pesisir timur Situbondo. Sangat dekat dengan jalur utama pantura dan pusat keramaian Asembagus.
              </p>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
                <span>Situbondo, Jawa Timur</span>
                <span className="font-mono text-emerald-400 font-bold">Kode Pos: 68373</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
