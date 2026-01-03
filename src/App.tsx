import Sidebar from "@/components/Sidebar/Sidebar";
import { MapContainer } from "@/components/MapContainer/MapContainer";
import { useState } from "react";
import type { TransportType } from "@config";

function App() {
  const [selectedRoutes, setSelectedRoutes] = useState<Array<{ id: number; type: TransportType }>>([]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar onRoutesChange={setSelectedRoutes} />
      <MapContainer selectedRoutes={selectedRoutes} />
    </div>
  );
}

export default App
