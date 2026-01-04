import { useStations, type Station } from '@/hooks/useStations';
import './Stations.css';

interface StationsProps {
    onStationSelect?: (lat: number, lng: number) => void;
}

export default function Stations({ onStationSelect }: StationsProps) {
    const { data: stations, isLoading, error } = useStations();

    if (isLoading) {
        return <p>Загрузка остановок...</p>;
    }

    if (error) {
        return <p className="error">Ошибка: {error.message}</p>;
    }
    
    const handleStationClick = (station: Station) => {
        onStationSelect?.(station.lat, station.lng);
    };

    return (
        <div className="stations-list">
            {stations?.length === 0 ? (
                <p className="text-muted">Остановки не найдены</p>
            ) : (
                <ul className="stations-grid">
                    {stations?.map((station) => (
                        <li
                            key={station.id}
                            className="station-item"
                            onClick={() => handleStationClick(station)}
                            style={{ cursor: 'pointer' }}
                        >
                            <strong>{station.name}</strong>
                            {station.descr && <span className="descr">({station.descr})</span>}
                            <small>{station.type === 0 ? "Автобусная" : "Трамвайная"}</small>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
