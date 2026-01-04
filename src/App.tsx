import Sidebar from "@/components/Sidebar/Sidebar";
import { MapContainer } from "@/components/MapContainer/MapContainer";
import { useState } from "react";
import type { TransportType } from "@config";
import { useRoutes } from "./hooks/useRoutes";

function App() {
  const [selectedRoutes, setSelectedRoutes] = useState<Array<{ id: number; type: TransportType }>>([]);
  const { data: routes, isLoading, error } = useRoutes();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        routes={routes || []}
        loading={isLoading}
        error={error}
        onRoutesChange={setSelectedRoutes}
      />
      <MapContainer
        selectedRoutes={selectedRoutes}
        routes={routes || []} />
    </div>
  );
}

export default App
