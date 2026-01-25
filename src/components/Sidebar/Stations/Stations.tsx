import './Stations.css';
import { useMemo, useState, useCallback, useRef, memo, useEffect } from 'react';
import type { Station } from '@/types/transport';
import { useVirtualizer } from '@tanstack/react-virtual';
import { filterStationsBySearch } from '@/services/stationService';

interface StationsProps {
    stations: Station[] | undefined;
    onStationSelect?: (lat: number, lng: number, id: number, name: string) => void;
}

const StationItem = memo(({ station, onClick }: { station: Station; onClick: () => void }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const nameRef = useRef<HTMLElement>(null);
    const descrRef = useRef<HTMLSpanElement>(null);
    const [showDescr, setShowDescr] = useState(!!station.descr);

    useEffect(() => {
        if (!containerRef.current || !station.descr || !nameRef.current) {
            setShowDescr(false);
            return;
        }

        const checkOverflow = () => {
            const container = containerRef.current;
            const nameElement = nameRef.current;
            const descrElement = descrRef.current;
            if (!container || !nameElement) return;

            const nameWidth = nameElement.scrollWidth;
            const containerWidth = container.clientWidth;
            
            if (nameWidth > containerWidth) {
                setShowDescr(false);
                return;
            }

            // Для измерения используем visibility: hidden (элемент занимает место, но невидим)
            // Это позволяет измерить полную ширину с описанием
            if (descrElement) {
                // Временно показываем для измерения
                const originalVisibility = descrElement.style.visibility;
                const originalDisplay = descrElement.style.display;
                descrElement.style.visibility = 'hidden';
                descrElement.style.display = 'inline';
                
                const totalWidth = container.scrollWidth;
                const fits = totalWidth <= containerWidth;
                
                // Восстанавливаем оригинальные стили, React применит финальные через showDescr
                descrElement.style.visibility = originalVisibility;
                descrElement.style.display = originalDisplay;
                
                // Устанавливаем состояние, стили применятся через React
                setShowDescr(fits);
            }
        };

        const timeoutId = setTimeout(checkOverflow, 0);
        
        const resizeObserver = new ResizeObserver(checkOverflow);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            clearTimeout(timeoutId);
            resizeObserver.disconnect();
        };
    }, [station.descr, station.name]);

    return (
        <li className="station-item" onClick={onClick}>
            <div className="station-name-container" ref={containerRef}>
                <strong ref={nameRef}>{station.name}</strong>
                {station.descr && (
                    <span 
                        className="descr" 
                        ref={descrRef}
                        style={{ display: showDescr ? 'inline' : 'none' }}
                    >
                        ({station.descr})
                    </span>
                )}
            </div>
            <small>{station.type === 0 ? 'Автобусная' : 'Трамвайная'}</small>
        </li>
    );
});

export default function Stations({ stations, onStationSelect }: StationsProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleStationClick = useCallback(
        (station: Station) => {
            onStationSelect?.(station.lat, station.lng, station.id, station.name);
        },
        [onStationSelect]
    );

    const filteredStations = useMemo(() => {
        return filterStationsBySearch(stations, searchTerm);
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
