import React, { useRef, useEffect, useState } from "react";
import type { Animation } from "@/types/transport";
import { useCanvasVehicleAnimations } from "@/hooks/useCanvasVehicleAnimations";
import { useVehicleMarkerPositions } from "@/hooks/useVehicleMarkerPositions";
import { useVehicleCanvasRender } from "@/hooks/useVehicleCanvasRender";
import { getTimeSinceUpdate } from "@/utils/timeUtils";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import "./VehicleCanvasLayer.css";

interface VehicleCanvasLayerProps {
    vehicles: Animation[];
    routeColorsMap: Map<string, string>;
    selectedVehicleId: string | null;
    onVehicleClick: (vehicle: Animation) => void;
    mapState?: {
        center: [number, number];
        zoom: number;
        bounds: { ne: [number, number]; sw: [number, number] };
        width: number;
        height: number;
    };
    latLngToPixel?: (latLng: [number, number]) => [number, number];
}

export const VehicleCanvasLayer: React.FC<VehicleCanvasLayerProps> = ({
    vehicles,
    routeColorsMap,
    selectedVehicleId,
    onVehicleClick,
    mapState,
    latLngToPixel,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredVehicleId, setHoveredVehicleId] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const isDesktop = useIsDesktop();

    const dimensions = mapState
        ? { width: mapState.width, height: mapState.height }
        : { width: window.innerWidth, height: window.innerHeight };

    const handleAnimationFrameRef = useRef<(() => void) | null>(null);

    const handleAnimationFrame = () => {
        if (handleAnimationFrameRef.current) {
            handleAnimationFrameRef.current();
        }
    };

    const { animationStates, hasActiveAnimations } = useCanvasVehicleAnimations(
        vehicles,
        2000,
        handleAnimationFrame
    );

    const handleAnimationFrameFromRender = useVehicleCanvasRender({
        canvasRef,
        vehicles,
        animationStates,
        selectedVehicleId,
        routeColorsMap,
        latLngToPixel,
        dimensions,
        hasActiveAnimations,
    });

    useEffect(() => {
        handleAnimationFrameRef.current = handleAnimationFrameFromRender;
    }, [handleAnimationFrameFromRender]);

    const markerPositions = useVehicleMarkerPositions({
        vehicles,
        animationStates,
        latLngToPixel,
        selectedVehicleId,
        dimensions,
    });

    useEffect(() => {
        if (!isDesktop || !hoveredVehicleId) return;

        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, [hoveredVehicleId, isDesktop]);

    const hoveredVehicle = hoveredVehicleId
        ? vehicles.find(v => v.id === hoveredVehicleId)
        : null;

    const hoveredPosition = hoveredVehicle
        ? markerPositions.find(pos => pos.vehicle.id === hoveredVehicleId)
        : null;

    return (
        <>
            <div
                ref={containerRef}
                className="vehicle-canvas-container"
            >
                <canvas
                    ref={canvasRef}
                    className="vehicle-canvas"
                    data-testid="vehicle-canvas"
                />
            </div>
            {markerPositions.map((pos, idx) => (
                <div
                    key={`${pos.vehicle.id}-${pos.vehicle.rtype}-${idx}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onVehicleClick(pos.vehicle);
                    }}
                    onMouseEnter={isDesktop ? () => setHoveredVehicleId(pos.vehicle.id) : undefined}
                    onMouseLeave={isDesktop ? () => setHoveredVehicleId(null) : undefined}
                    className="vehicle-marker-clickable"
                    style={{
                        left: pos.x - pos.radius,
                        top: pos.y - pos.radius,
                        width: pos.radius * 2,
                        height: pos.radius * 2,
                    }}
                />
            ))}
            {isDesktop && hoveredVehicle && hoveredPosition && (
                <div
                    className="vehicle-tooltip"
                    style={{
                        left: hoveredPosition.x,
                        top: hoveredPosition.y - hoveredPosition.radius - 10,
                    }}
                >
                    <div className="vehicle-tooltip-content">
                        <div className="vehicle-tooltip-gosnum">{hoveredVehicle.gos_num}</div>
                        <div className="vehicle-tooltip-time">
                            {getTimeSinceUpdate(hoveredVehicle.lasttime, currentTime)} сек
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
