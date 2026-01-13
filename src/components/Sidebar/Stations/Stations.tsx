import './Stations.css';
import { useMemo, useState, useCallback, useRef, memo } from 'react';
import type { Station } from '@/types/transport';
import { useVirtualizer } from '@tanstack/react-virtual';

interface StationsProps {
    stations: Station[] | undefined;
    onStationSelect?: (lat: number, lng: number, id: number, name: string) => void;
}

const StationItem = memo(({ station, onClick }: { station: Station; onClick: () => void }) => (
    <li className="station-item" onClick={onClick} style={{ cursor: 'pointer' }}>
        <div className="station-name-container">
            <strong>{station.name}</strong>
            {station.descr && <span className="descr">({station.descr})</span>}
        </div>
        <small>{station.type === 0 ? 'Автобусная' : 'Трамвайная'}</small>
    </li>
));

export default function Stations({ stations, onStationSelect }: StationsProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleStationClick = useCallback(
        (station: Station) => {
            onStationSelect?.(station.lat, station.lng, station.id, station.name);
        },
        [onStationSelect]
    );

    const filteredStations = useMemo(() => {
        if (!stations) return [];
        const term = searchTerm.toLowerCase();
        return stations.filter((station) => station.name.toLowerCase().includes(term));
    }, [stations, searchTerm]);

    const parentRef = useRef<HTMLDivElement>(null);

    const rowHeight = 56; // Должно соответствовать .virtual-station-item

    const virtualizer = useVirtualizer({
        count: filteredStations.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan: 5,
    });

    return (
        <div className="stations-list">
            <input
                type="text"
                placeholder="Поиск остановок..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                aria-label="Поиск остановок"
            />

            {filteredStations.length === 0 ? (
                <p className="text-muted">Остановки не найдены</p>
            ) : (
                <div ref={parentRef} className="stations-grid">
                    <div className="virtual-items-container">
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                            const station = filteredStations[virtualRow.index];
                            return (
                                <div
                                    key={station.id}
                                    className="virtual-station-item"
                                    style={{
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    <StationItem
                                        station={station}
                                        onClick={() => handleStationClick(station)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
