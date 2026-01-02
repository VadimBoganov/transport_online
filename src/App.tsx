import Sidebar from "@/components/Sidebar/Sidebar";
import { MapContainer } from "@/components/MapContainer/MapContainer";
import { useState } from "react";
import type { TransportType } from "@config";

function App() {
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [selectedRouteType, setSelectedRouteType] = useState<TransportType | null>(null);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        onRouteSelect={(id, type) => {
          setSelectedRouteId(id);
          setSelectedRouteType(type);
        }}
      />
      <MapContainer
        selectedRouteId={selectedRouteId}
        selectedRouteType={selectedRouteType}
      />
    </div>
  );
}

export default App
