import Sidebar from "@/components/Sidebar/Sidebar";
import { MapContainer } from "@/components/MapContainer/MapContainer";
import { useRoutes } from "./hooks/useRoutes";
import config from "@config";
import { useMapState } from "./hooks/useMapState";
import { useMapData } from "./hooks/useMapData";
import { useStations } from "./hooks/useStations";

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

  const { openForecastStationPopup } = useMapData({
    selectedRoutes,
    routes,
    selectedStation,
    selectedVehicle,
  });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        routes={routes || []}
        loading={isLoading}
        error={error}
        onRoutesChange={setSelectedRoutes}
        onStationSelect={(lat, lng, id, name) => {
          setSelectedStation({ lat, lng, id, name });
          openForecastStationPopup({ id, name, lat, lng });
        }}
        stations={stations}
      />
      <MapContainer
        selectedRoutes={selectedRoutes}
        routes={routes || []}
        center={
          selectedStation
            ? [selectedStation.lat / 1e6, selectedStation.lng / 1e6]
            : [config.map.lat, config.map.lng]
        }
        zoom={
          selectedStation ? (config.map.stationSelectZoom ?? 17) : config.map.zoom
        }
        selectedStation={selectedStation}
        selectedVehicle={selectedVehicle}
        onStationDeselect={() => setSelectedStation(null)}
        setSelectedVehicle={setSelectedVehicle}
      />
    </div>
  );
}

export default App
