import React, { useRef, useEffect, useCallback, useState } from "react";
import type { Animation } from "@/types/transport";
import { useCanvasVehicleAnimations } from "@/hooks/useCanvasVehicleAnimations";
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

const MARKER_RADIUS = 16;
const MARKER_BORDER_WIDTH = 2;
const SELECTED_MARKER_BORDER_WIDTH = 3;
const SELECTED_MARKER_SCALE = 1.15;
const ARROW_SIZE = 12;
const ARROW_OFFSET = 14;

const getTimeSinceUpdate = (lasttime: string, currentTime: number = Date.now()): number => {
    if (!lasttime) return 0;

    const currentTimeSeconds = Math.floor(currentTime / 1000) - 10800;

    const [datePart, timePart] = lasttime.split(' ');
    const [day, month, year] = datePart.split('.').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    const date = new Date(year, month - 1, day, hours, minutes, seconds);

    const lastTimeSeconds = Math.floor(date.getTime() / 1000);

    if (isNaN(lastTimeSeconds)) {
        return 0;
    }

    return Math.max(0, currentTimeSeconds - lastTimeSeconds);
};

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
    const redrawRequestedRef = useRef(false);
    const [hoveredVehicleId, setHoveredVehicleId] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(Date.now());

    const dimensions = mapState
        ? { width: mapState.width, height: mapState.height }
        : { width: window.innerWidth, height: window.innerHeight };

    const handleAnimationFrame = useCallback(() => {
        redrawRequestedRef.current = true;
    }, []);

    const { animationStates, hasActiveAnimations } = useCanvasVehicleAnimations(
        vehicles,
        2000,
        handleAnimationFrame
    );

    const drawMarker = useCallback(
        (
            ctx: CanvasRenderingContext2D,
            vehicle: Animation,
            x: number,
            y: number,
            isSelected: boolean
        ) => {
            const color = routeColorsMap.get(vehicle.rtype) || "gray";
            const scale = isSelected ? SELECTED_MARKER_SCALE : 1;
            const radius = MARKER_RADIUS * scale;
            const borderWidth = isSelected ? SELECTED_MARKER_BORDER_WIDTH : MARKER_BORDER_WIDTH;

            ctx.save();

            if (isSelected) {
                ctx.shadowColor = "rgba(0, 123, 255, 0.8)";
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = "white";
                ctx.fill();

                ctx.shadowBlur = 0;
            }

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            ctx.strokeStyle = "white";
            ctx.lineWidth = borderWidth;
            ctx.stroke();

            ctx.fillStyle = "white";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
            ctx.shadowBlur = 1;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            ctx.fillText(vehicle.rnum, x, y);

            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            const dirRadians = (vehicle.dir * Math.PI) / 180;
            const arrowX = x + Math.cos(dirRadians) * ARROW_OFFSET * scale;
            const arrowY = y + Math.sin(dirRadians) * ARROW_OFFSET * scale;

            ctx.translate(arrowX, arrowY);
            ctx.rotate(dirRadians);

            ctx.beginPath();
            ctx.moveTo(0, -ARROW_SIZE * scale);
            ctx.lineTo(-4 * scale, ARROW_SIZE / 2 * scale);
            ctx.lineTo(4 * scale, ARROW_SIZE / 2 * scale);
            ctx.closePath();
            ctx.fillStyle = "black";
            ctx.fill();

            ctx.restore();
        },
        [routeColorsMap]
    );

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !latLngToPixel) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const { width, height } = dimensions;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, height);

        const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
        const otherVehicles = vehicles.filter(v => v.id !== selectedVehicleId);

        [...otherVehicles, ...(selectedVehicle ? [selectedVehicle] : [])].forEach((vehicle) => {
            const key = `${vehicle.id}-${vehicle.rtype}`;
            const animState = animationStates.current.get(key);
            
            let lat = animState ? animState.current.lat : vehicle.lat;
            let lon = animState ? animState.current.lon : vehicle.lon;

            lat = lat / 1000000;
            lon = lon / 1000000;

            const [x, y] = latLngToPixel([lat, lon]);

            if (x < -50 || x > width + 50 || y < -50 || y > height + 50) {
                return;
            }

            const isSelected = vehicle.id === selectedVehicleId;
            drawMarker(ctx, vehicle, x, y, isSelected);
        });

        redrawRequestedRef.current = false;
    }, [vehicles, animationStates, dimensions, selectedVehicleId, drawMarker, latLngToPixel]);

    useEffect(() => {
        render();
    }, [render]);

    useEffect(() => {
        let rafId: number;

        const renderLoop = () => {
            if (redrawRequestedRef.current || hasActiveAnimations()) {
                render();
            }
            rafId = requestAnimationFrame(renderLoop);
        };

        rafId = requestAnimationFrame(renderLoop);

        return () => {
            cancelAnimationFrame(rafId);
        };
    }, [render, hasActiveAnimations]);

    useEffect(() => {
        if (!hoveredVehicleId) return;

        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, [hoveredVehicleId]);

    const markerPositions = latLngToPixel ? vehicles.map((vehicle) => {
        const key = `${vehicle.id}-${vehicle.rtype}`;
        const animState = animationStates.current.get(key);

        let lat = animState ? animState.current.lat : vehicle.lat;
        let lon = animState ? animState.current.lon : vehicle.lon;

        lat = lat / 1000000;
        lon = lon / 1000000;

        const { width, height } = dimensions;
        const [x, y] = latLngToPixel([lat, lon]);

        const isSelected = vehicle.id === selectedVehicleId;
        const radius = MARKER_RADIUS * (isSelected ? SELECTED_MARKER_SCALE : 1) + 4;

        return {
            vehicle,
            x,
            y,
            radius,
            visible: x >= -50 && x <= width + 50 && y >= -50 && y <= height + 50
        };
    }).filter(pos => pos.visible) : [];

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
                    onMouseEnter={() => setHoveredVehicleId(pos.vehicle.id)}
                    onMouseLeave={() => setHoveredVehicleId(null)}
                    className="vehicle-marker-clickable"
                    style={{
                        left: pos.x - pos.radius,
                        top: pos.y - pos.radius,
                        width: pos.radius * 2,
                        height: pos.radius * 2,
                    }}
                />
            ))}
            {hoveredVehicle && hoveredPosition && (
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
