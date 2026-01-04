import { Overlay } from "pigeon-maps";
import useStationForecast from "@/hooks/useStationForecast";
import type { Forecast } from "@/hooks/useStationForecast";
import "./StationPopup.css";

interface StationPopupProps {
    lat: number;
    lng: number;
    stationId: number;
    stationName: string;
    onDeselect: () => void;
}

export function StationPopup({
    lat,
    lng,
    stationId,
    stationName,
    onDeselect
}: StationPopupProps) {
    const { data: forecasts, isLoading: forecastsLoading } = useStationForecast({
        stationId
    });

    return (
        <Overlay anchor={[lat / 1e6, lng / 1e6]} offset={[0, -40]}>
            <div className="station-popup">
                <h4>{stationName}</h4>
                {forecastsLoading ? (
                    <p>Загрузка прогнозов...</p>
                ) : forecasts && forecasts.length > 0 ? (
                    <ul>
                        {forecasts.slice(0, 5).map((forecast: Forecast, i) => (
                            <li key={i}>
                                <strong>{forecast.rnum} ({forecast.rtype})</strong>
                                {' '}→ {Math.round(forecast.arrt / 60)} мин
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Нет данных о прибытии</p>
                )}
                <button onClick={onDeselect}>
                    Закрыть
                </button>
            </div>
        </Overlay>
    );
}
