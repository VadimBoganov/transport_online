import { useStations } from '@/hooks/useStations';
import './Stations.css';

export default function Stations() {
    const {data: stations, isLoading, error } = useStations();

    if (isLoading) {
        return <p>Загрузка остановок...</p>;
    }

    if (error) {
        return <p className="error">Ошибка: {error.message}</p>;
    }

    return (
        <div className="stations-list">
            {stations?.length === 0 ? (
                <p className="text-muted">Остановки не найдены</p>
            ) : (
                <ul className="stations-grid">
                    {stations?.map((station) => (
                        <li key={station.id} className="station-item">
                            <strong>{station.name}</strong>
                            {station.descr && <span className="descr">({station.descr})</span>}
                            <small>
                                {station.type == 0 ? "Автобусная" : "Трамвайная"}
                            </small>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
