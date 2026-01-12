import { useStations } from '@/hooks/useStations';
import './Stations.css';
import { useState } from 'react';
import type { Station } from '@/types/transport';

interface StationsProps {
    onStationSelect?: (lat: number, lng: number, id: number, name: string) => void;
}

export default function Stations({ onStationSelect }: StationsProps) {
    const { data: stations, isLoading, error } = useStations();
    const [searchTerm, setSearchTerm] = useState('');

    if (isLoading) {
        return <p>Загрузка остановок...</p>;
    }

    if (error) {
        return <p className="error">Ошибка: {error.message}</p>;
    }

    const handleStationClick = (station: Station) => {
        onStationSelect?.(station.lat, station.lng, station.id, station.name);
    };

    const filteredStations = stations?.filter(station =>
        station.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="stations-list">
            <input
                type="text"
                placeholder="Поиск остановок..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
            />
            {filteredStations.length === 0 ? (
                <p className="text-muted">Остановки не найдены</p>
            ) : (
                <ul className="stations-grid">
                    {filteredStations?.map((station) => (
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
