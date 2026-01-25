import Sidebar from "@/components/Sidebar/Sidebar";
import { MapContainer } from "@/components/MapContainer/MapContainer";
import { useRoutes } from "./hooks/useRoutes";
import config from "@config";
import { useMapState } from "./hooks/useMapState";
import { useStations } from "./hooks/useStations";
import { useCallback, useState } from "react";
import { normalizeCoordinate } from "@/utils/coordinates";
import "./App.css";

function App() {
  const {
    selectedRoutes,
    selectedStation,
    selectedVehicle,
    setSelectedStation,
    setSelectedRoutes,
    setSelectedVehicle,
  } = useMapState();

  const { data: routes, isLoading, error } = useRoutes();
  const { data: stations } = useStations();

  const [center, setCenter] = useState<[number, number]>([config.map.lat, config.map.lng]);
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const initialZoom = isMobile ? (config.map.mobileZoom ?? config.map.zoom) : config.map.zoom;
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleStationSelect = useCallback((lat: number, lng: number, id: number, name: string) => {
    setSelectedStation({ lat, lng, id, name });
    setCenter([normalizeCoordinate(lat), normalizeCoordinate(lng)]);
    const isMobileDevice = typeof window !== 'undefined' && window.innerWidth <= 768;
    const stationZoom = isMobileDevice 
      ? (config.map.mobileStationSelectZoom ?? config.map.stationSelectZoom ?? 17)
      : (config.map.stationSelectZoom ?? 17);
    setZoom(stationZoom);
    if (isMobileDevice) {
      setIsSidebarOpen(false);
    }
  }, [setSelectedStation]);

  const handleStationDeselect = useCallback(() => {
    setSelectedStation(null);
  }, [setSelectedStation]);

  const mapView = {
    center,
    zoom,
    onCenterChange: setCenter,
  } as const;

  return (
    <div className="app-root">
      <Sidebar
        routes={routes || []}
        loading={isLoading}
        error={error}
        selectedRoutes={selectedRoutes}
        onRoutesChange={setSelectedRoutes}
        onStationSelect={handleStationSelect}
        stations={stations}
        onToggle={setIsSidebarOpen}
      />
      <MapContainer
        selectedRoutes={selectedRoutes}
        routes={routes || []}
        mapView={mapView}
        selectedStation={selectedStation}
        selectedVehicle={selectedVehicle}
        onStationDeselect={handleStationDeselect}
        setSelectedVehicle={setSelectedVehicle}
        isSidebarOpen={isSidebarOpen}
      />
    </div>
  );
}

export default App
