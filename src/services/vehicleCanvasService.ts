import type { Animation } from "@/types/transport";
import config from "@config";

export const MARKER_RADIUS = 16;
export const MARKER_BORDER_WIDTH = 2;
export const SELECTED_MARKER_BORDER_WIDTH = 3;
export const SELECTED_MARKER_SCALE = 1.15;
export const ARROW_SIZE = 12;
export const ARROW_OFFSET = 14;

export interface DrawMarkerParams {
    ctx: CanvasRenderingContext2D;
    vehicle: Animation;
    x: number;
    y: number;
    isSelected: boolean;
    routeColor: string;
}

export const drawMarker = ({
    ctx,
    vehicle,
    x,
    y,
    isSelected,
    routeColor,
}: DrawMarkerParams): void => {
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
    ctx.fillStyle = routeColor;
    ctx.fill();

    // Используем другой цвет бордера для низкопольных ТС
    ctx.strokeStyle = +vehicle.low_floor === 1 
        ? config.vehicleMarkers.lowFloorBorderColor 
        : config.vehicleMarkers.borderColor;
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
};
