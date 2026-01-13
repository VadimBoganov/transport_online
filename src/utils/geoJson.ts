import type { RouteNode } from '@/types/transport';
import { normalizeCoordinate } from './coordinates';

export interface LineStringFeature {
    type: "Feature";
    geometry: {
        type: "LineString";
        coordinates: [number, number][];
    };
    properties: { stroke: string };
}

export interface LineStringFeatureCollection {
    type: "FeatureCollection";
    features: LineStringFeature[];
}

/**
 * Создает GeoJSON Feature с LineString геометрией из массива узлов маршрута
 * @param nodes - массив узлов маршрута
 * @param color - цвет линии
 * @returns GeoJSON Feature или null, если узлов недостаточно
 */
export function buildLineStringGeoJSON(
    nodes: RouteNode[],
    color: string
): LineStringFeature | null {
    if (!nodes || nodes.length < 2) {
        return null;
    }

    return {
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: nodes.map(node => [
                normalizeCoordinate(node.lng),
                normalizeCoordinate(node.lat)
            ]) as [number, number][],
        },
        properties: { stroke: color },
    };
}
