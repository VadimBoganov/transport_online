import React from "react";
import config from "@config";
import "./VehicleMarkersLegend.css";

export interface VehicleMarkersLegendProps {
    isSidebarOpen?: boolean;
}

export const VehicleMarkersLegend = ({ isSidebarOpen }: VehicleMarkersLegendProps) => {
    // Используем первый цвет маршрута из конфига для примера маркера
    const exampleRouteColor = config.routes.length > 0 ? config.routes[0].color : "#4a90e2";

    return (
        <div className={`vehicle-markers-legend ${isSidebarOpen ? "vehicle-markers-legend--sidebar-open" : ""}`}>
            <div className="legend-title">Легенда маркеров</div>

            <div className="legend-section">
                <div className="legend-section-title">Типы Транспорта</div>
                <div className="legend-items">
                    {config.routes.map(route => (
                        <div className="legend-item" key={route.type}>
                            <div
                                className="legend-route-color"
                                style={{ backgroundColor: route.color }}
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
                                className="legend-marker"
                                style={{
                                    backgroundColor: exampleRouteColor,
                                    borderColor: config.vehicleMarkers.borderColor,
                                }}
                            >
                                <span className="legend-marker-text">1</span>
                            </div>
                        </div>
                        <span className="legend-label">Обычное ТС</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-marker-wrapper">
                            <div
                                className="legend-marker"
                                style={{
                                    backgroundColor: exampleRouteColor,
                                    borderColor: config.vehicleMarkers.lowFloorBorderColor,
                                }}
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
