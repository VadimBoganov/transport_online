import React from "react";
import "./VehicleMarker.css";

interface VehicleMarkerProps {
    rnum: string;
    rtype: string;
    dir: number;
    onClick: (e: React.MouseEvent) => void;
    color: string;
    isSelected: boolean;
}

const getTransformStyle = (dir: number) => {
    const radians = (dir * Math.PI) / 180;
    const x = Math.cos(radians) * 14;
    const y = Math.sin(radians) * 14;
    return `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${dir}deg)`;
};

export const VehicleMarker: React.FC<VehicleMarkerProps> = React.memo(({
    rnum,
    dir,
    onClick,
    color,
    isSelected
}) => {
    return (
        <div className={`vehicle-marker ${isSelected ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={onClick}>
            {rnum}
            <div
                className="vehicle-marker-arrow"
                style={{ transform: getTransformStyle(dir) }}
            />
        </div>
    );
});
