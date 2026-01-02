import { Map } from "pigeon-maps"
import '@config'
import config from "@config"
import { useState } from "react"
import "./MapContainer.css";

export function MapContainer() {
    const [center, setCenter] = useState<[number, number]>([config.map.lat, config.map.lng]);
    const [zoom, setZoom] = useState<number>(config.map.zoom);
    return (
        <div className="map-container">
            <Map
                center={center}
                zoom={zoom}
                onBoundsChanged={({ center, zoom }) => {
                    setCenter(center);
                    setZoom(zoom);
                }}
                height={window.innerHeight}
                width={window.innerWidth}
            />
        </div>
    )
}