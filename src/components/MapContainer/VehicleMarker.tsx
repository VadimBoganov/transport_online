import React from "react";
import "./VehicleMarker.css";

interface VehicleMarkerProps {
    rnum: string;
    rtype: string;
    dir: number;
    onClick: (e: React.MouseEvent<HTMLElement>) => void;
    color: string;
    isSelected: boolean;
    'data-rid': number;
    'data-id': string;
    'data-rtype': string;
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
    isSelected,
    'data-rid': dataRid,
    'data-id': dataId,
    'data-rtype': dataRtype,
}) => {
    return (
        <div 
            className={`vehicle-marker ${isSelected ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={onClick}
            data-rid={dataRid}
            data-id={dataId}
            data-rtype={dataRtype}
        >
            {rnum}
            <div
                className="vehicle-marker-arrow"
                style={{ transform: getTransformStyle(dir) }}
            />
        </div>
    );
}, (prev, next) => {
    // Custom compare: игнорируем onClick (он всегда один и тот же),
    // сравниваем только данные маркера
    return (
        prev.rnum === next.rnum &&
        prev.dir === next.dir &&
        prev.color === next.color &&
        prev.isSelected === next.isSelected &&
        prev['data-rid'] === next['data-rid'] &&
        prev['data-id'] === next['data-id'] &&
        prev['data-rtype'] === next['data-rtype']
    );
});
