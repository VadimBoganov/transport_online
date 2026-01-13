import Sidebar from "@/components/Sidebar/Sidebar";
import { MapContainer } from "@/components/MapContainer/MapContainer";
import { useRoutes } from "./hooks/useRoutes";
import config from "@config";
import { useMapState } from "./hooks/useMapState";
import { useStations } from "./hooks/useStations";
import { useCallback, useState } from "react";
import { normalizeCoordinate } from "@/utils/coordinates";

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
  const [zoom, setZoom] = useState<number>(config.map.zoom);

  const handleStationSelect = useCallback((lat: number, lng: number, id: number, name: string) => {
    setSelectedStation({ lat, lng, id, name });
    setCenter([normalizeCoordinate(lat), normalizeCoordinate(lng)]);
    setZoom(config.map.stationSelectZoom ?? 17);
  }, []);

  const handleStationDeselect = useCallback(() => {
    setSelectedStation(null);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        routes={routes || []}
        loading={isLoading}
        error={error}
        onRoutesChange={setSelectedRoutes}
        onStationSelect={handleStationSelect}
        stations={stations}
      />
      <MapContainer
        selectedRoutes={selectedRoutes}
        routes={routes || []}
        center={center}
        zoom={zoom}
        onCenterChange={setCenter}
        selectedStation={selectedStation}
        selectedVehicle={selectedVehicle}
        onStationDeselect={handleStationDeselect}
        setSelectedVehicle={setSelectedVehicle}
      />
    </div>
  );
}

export default App
