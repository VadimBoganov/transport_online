import React from "react";
import "./VehicleMarker.css";

interface VehicleMarkerProps {
    rnum: string;
    rtype: string;
    dir: number;
    onClick: (e: React.MouseEvent) => void;
    color: string;
}

export const VehicleMarker: React.FC<VehicleMarkerProps> = ({
    rnum,
    dir,
    onClick,
    color,
}) => {
    return (
        <div className="vehicle-marker" style={{ backgroundColor: color }} onClick={onClick}>
            {rnum}
            <div
                className="vehicle-marker-arrow"
                style={{
                    transform: `translate(-50%, -50%) 
                        translate(${Math.cos((dir * Math.PI) / 180) * 14}px, 
                                  ${Math.sin((dir * Math.PI) / 180) * 14}px)
                        rotate(${dir}deg)`,
                }}
            />
        </div>
    );
};
