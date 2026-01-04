import Sidebar from "@/components/Sidebar/Sidebar";
import { MapContainer } from "@/components/MapContainer/MapContainer";
import { useState } from "react";
import type { TransportType } from "@config";
import { useRoutes } from "./hooks/useRoutes";
import config from "@config";

function App() {
  const [selectedRoutes, setSelectedRoutes] = useState<Array<{ id: number; type: TransportType }>>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([config.map.lat, config.map.lng]);
  const [mapZoom, setMapZoom] = useState<number>(config.map.zoom);

  const { data: routes, isLoading, error } = useRoutes();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        routes={routes || []}
        loading={isLoading}
        error={error}
        onRoutesChange={setSelectedRoutes}
        onStationSelect={(lat, lng) => {
          setMapCenter([lat / 1e6, lng / 1e6]);
          setMapZoom(config.map.stationSelectZoom);
        }}
      />
      <MapContainer
        selectedRoutes={selectedRoutes}
        routes={routes || []}
        center={mapCenter}
        zoom={mapZoom}
        onCenterChange={(center, zoom) => {
          setMapCenter(center);
          setMapZoom(zoom);
        }}
      />
    </div>
  );
}

export default App
