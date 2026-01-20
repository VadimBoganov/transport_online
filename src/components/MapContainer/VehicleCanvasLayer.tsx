import React, { useRef, useEffect, useCallback, useState } from "react";
import type { Animation } from "@/types/transport";
import { latLonToCanvasPixel } from "@/utils/mapProjection";
import { useCanvasVehicleAnimations } from "@/hooks/useCanvasVehicleAnimations";

interface VehicleCanvasLayerProps {
    vehicles: Animation[];
    routeColorsMap: Map<string, string>;
    selectedVehicleId: string | null;
    onVehicleClick: (vehicle: Animation) => void;
    mapZoom: number;
    mapCenter: [number, number];
}

// Marker constants matching the original CSS
const MARKER_RADIUS = 16;
const MARKER_BORDER_WIDTH = 2;
const SELECTED_MARKER_BORDER_WIDTH = 3;
const SELECTED_MARKER_SCALE = 1.15;
const ARROW_SIZE = 12;
const ARROW_OFFSET = 14;

export const VehicleCanvasLayer: React.FC<VehicleCanvasLayerProps> = ({
    vehicles,
    routeColorsMap,
    selectedVehicleId,
    onVehicleClick,
    mapZoom,
    mapCenter,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState(() => ({
        width: window.innerWidth,
        height: window.innerHeight
    }));
    const redrawRequestedRef = useRef(false);

    // Request redraw when animation frame occurs
    const handleAnimationFrame = useCallback(() => {
        redrawRequestedRef.current = true;
    }, []);

    // Use animation hook
    const { animationStates, hasActiveAnimations } = useCanvasVehicleAnimations(
        vehicles,
        2000,
        handleAnimationFrame
    );

    // Update canvas dimensions based on container
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const width = rect.width || 800;
                const height = rect.height || 600;
                setDimensions({ width, height });
            }
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    // Draw a single vehicle marker
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

            // Draw glow effect for selected marker
            if (isSelected) {
                ctx.shadowColor = "rgba(0, 123, 255, 0.8)";
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = "white";
                ctx.fill();
                
                // Reset shadow for main marker
                ctx.shadowBlur = 0;
            }

            // Draw main circle
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            // Draw white border
            ctx.strokeStyle = "white";
            ctx.lineWidth = borderWidth;
            ctx.stroke();

            // Draw route number text
            ctx.fillStyle = "white";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            // Text shadow for readability
            ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
            ctx.shadowBlur = 1;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            ctx.fillText(vehicle.rnum, x, y);

            // Reset shadow
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Draw direction arrow
            const dirRadians = (vehicle.dir * Math.PI) / 180;
            const arrowX = x + Math.cos(dirRadians) * ARROW_OFFSET * scale;
            const arrowY = y + Math.sin(dirRadians) * ARROW_OFFSET * scale;

            ctx.translate(arrowX, arrowY);
            ctx.rotate(dirRadians);

            // Draw triangle arrow
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

    // Main render loop
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const { width, height } = dimensions;

        // Set canvas size accounting for device pixel ratio
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        // Scale context for retina displays
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw all vehicles
        vehicles.forEach((vehicle) => {
            const key = `${vehicle.id}-${vehicle.rtype}`;
            const animState = animationStates.current.get(key);
            
            // Use animated position if available, otherwise use current position
            let lat = animState ? animState.current.lat : vehicle.lat;
            let lon = animState ? animState.current.lon : vehicle.lon;

            // Normalize coordinates (convert from microdegrees to degrees)
            lat = lat / 1000000;
            lon = lon / 1000000;

            const [x, y] = latLonToCanvasPixel(
                lat,
                lon,
                mapZoom,
                width,
                height,
                mapCenter
            );

            // Skip markers outside viewport with margin
            if (x < -50 || x > width + 50 || y < -50 || y > height + 50) {
                return;
            }

            const isSelected = vehicle.id === selectedVehicleId;
            drawMarker(ctx, vehicle, x, y, isSelected);
        });

        redrawRequestedRef.current = false;
    }, [vehicles, animationStates, mapZoom, mapCenter, dimensions, selectedVehicleId, drawMarker]);

    // Render on mount and when dependencies change
    useEffect(() => {
        render();
    }, [render]);

    // Continuous render loop while animations are active
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

    // Calculate marker positions for interactive overlays
    const markerPositions = vehicles.map((vehicle) => {
        const key = `${vehicle.id}-${vehicle.rtype}`;
        const animState = animationStates.current.get(key);
        
        let lat = animState ? animState.current.lat : vehicle.lat;
        let lon = animState ? animState.current.lon : vehicle.lon;

        // Normalize coordinates (convert from microdegrees to degrees)
        lat = lat / 1000000;
        lon = lon / 1000000;

        const { width, height } = dimensions;
        const [x, y] = latLonToCanvasPixel(
            lat,
            lon,
            mapZoom,
            width,
            height,
            mapCenter
        );

        const isSelected = vehicle.id === selectedVehicleId;
        const radius = MARKER_RADIUS * (isSelected ? SELECTED_MARKER_SCALE : 1) + 4; // +4 for easier clicking

        return {
            vehicle,
            x,
            y,
            radius,
            // Only show if in viewport
            visible: x >= -50 && x <= width + 50 && y >= -50 && y <= height + 50
        };
    }).filter(pos => pos.visible);

    return (
        <>
            {/* Canvas layer for rendering - non-interactive */}
            <div
                ref={containerRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 10,
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                    }}
                />
            </div>
            {/* Interactive zones for each marker */}
            {markerPositions.map((pos, idx) => (
                <div
                    key={`${pos.vehicle.id}-${pos.vehicle.rtype}-${idx}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onVehicleClick(pos.vehicle);
                    }}
                    style={{
                        position: "absolute",
                        left: pos.x - pos.radius,
                        top: pos.y - pos.radius,
                        width: pos.radius * 2,
                        height: pos.radius * 2,
                        borderRadius: "50%",
                        pointerEvents: "auto",
                        cursor: "pointer",
                        zIndex: 11,
                        // For debugging: uncomment to see interactive zones
                        // background: "rgba(255, 0, 0, 0.2)",
                    }}
                />
            ))}
        </>
    );
};
