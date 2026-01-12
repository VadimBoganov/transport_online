import './Stations.css';
import { useMemo, useState } from 'react';
import type { Station } from '@/types/transport';

interface StationsProps {
    stations: Station[] | undefined;
    onStationSelect?: (lat: number, lng: number, id: number, name: string) => void;
}

export default function Stations({stations, onStationSelect }: StationsProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleStationClick = (station: Station) => {
        onStationSelect?.(station.lat, station.lng, station.id, station.name);
    };

    const filteredStations = useMemo(() => {
        if (!stations) return [];
        const term = searchTerm.toLowerCase();
        return stations.filter(station =>
            station.name.toLowerCase().includes(term)
        );
    }, [stations, searchTerm]);

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
