import React from "react";
import { formatArrivalMinutes } from "@/services/forecastService";
import "./MapContainer.css";

interface ForecastPopupStationProps {
    arrt: number;
    stid: number;
    stname: string;
    lat0: number;
    lng0: number;
    onForecastClick: (e: React.MouseEvent<HTMLElement>) => void;
}

export const ForecastPopupStation = React.memo(({ 
    arrt, 
    stid, 
    stname, 
    lat0, 
    lng0,
    onForecastClick 
}: ForecastPopupStationProps) => {
    return (
        <div
            className="forecast-popup-station"
            onClick={onForecastClick}
            data-stid={stid}
            data-stname={stname}
            data-lat0={lat0}
            data-lng0={lng0}
        >
            <div className="forecast-time">
                <strong>{formatArrivalMinutes(arrt)} мин</strong>
            </div>
        </div>
    );
}, (prev, next) => {
    return (
        prev.stid === next.stid &&
        prev.lat0 === next.lat0 &&
        prev.lng0 === next.lng0 &&
        prev.arrt === next.arrt
    );
});
