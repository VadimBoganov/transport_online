import { useState, useEffect } from "react";
import config from "@config";
import "./VehicleMarkersLegend.css";

export interface VehicleMarkersLegendProps {
    isSidebarOpen?: boolean;
}

export const VehicleMarkersLegend = ({ isSidebarOpen }: VehicleMarkersLegendProps) => {
    // На desktop (> 992px) - открыта, на планшетах (768-992px) - закрыта
    const getInitialVisibility = () => {
        if (typeof window === 'undefined') return true;
        return window.innerWidth > 992;
    };
    
    const [isVisible, setIsVisible] = useState(getInitialVisibility);
    
    // Обновляем состояние при изменении размера окна
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width <= 768) {
                // На мобильных скрыта через CSS, но состояние можно оставить
                return;
            } else if (width > 992) {
                // На desktop открыта по умолчанию
                setIsVisible(true);
            } else {
                // На планшетах закрыта по умолчанию
                setIsVisible(false);
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isVisible) {
        return (
            <div className={`vehicle-markers-legend vehicle-markers-legend--collapsed ${isSidebarOpen ? "vehicle-markers-legend--sidebar-open" : ""}`}>
                <button
                    className="legend-toggle-button"
                    onClick={() => setIsVisible(true)}
                    title="Показать легенду"
                    aria-label="Показать легенду"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 2L2 8L8 14M14 2L8 8L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div className={`vehicle-markers-legend ${isSidebarOpen ? "vehicle-markers-legend--sidebar-open" : ""}`}>
            <div className="legend-header">
                <div className="legend-title">Легенда маркеров</div>
                <button
                    className="legend-toggle-button"
                    onClick={() => setIsVisible(false)}
                    title="Скрыть легенду"
                    aria-label="Скрыть легенду"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 2L8 8L2 14M14 2L8 8L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>

            <div className="legend-section">
                <div className="legend-section-title">Типы Транспорта</div>
                <div className="legend-items">
                    {config.routes.map(route => (
                        <div className="legend-item" key={route.type}>
                            <div
                                className={`legend-route-color legend-route-color--${route.type}`}
                            />
                            <span className="legend-label">
                                {route.title} ({route.type})
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="legend-section">
                <div className="legend-section-title">Бордюр маркера</div>
                <div className="legend-items">
                    <div className="legend-item">
                        <div className="legend-marker-wrapper">
                            <div
                                className="legend-marker legend-marker--normal"
                            >
                                <span className="legend-marker-text">1</span>
                            </div>
                        </div>
                        <span className="legend-label">Обычное ТС</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-marker-wrapper">
                            <div
                                className="legend-marker legend-marker--low-floor"
                            >
                                <span className="legend-marker-text">1</span>
                            </div>
                        </div>
                        <span className="legend-label">Низкопольное ТС</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
