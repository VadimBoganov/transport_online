/**
 * Web Mercator projection utilities for converting lat/lon to pixel coordinates
 * Used for canvas rendering of map markers
 */

const TILE_SIZE = 256;

/**
 * Convert latitude to Web Mercator Y coordinate (0-1 range)
 */
function latToY(lat: number): number {
    const sinLat = Math.sin((lat * Math.PI) / 180);
    return 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);
}

/**
 * Convert longitude to Web Mercator X coordinate (0-1 range)
 */
function lonToX(lon: number): number {
    return (lon + 180) / 360;
}

/**
 * Convert lat/lon coordinates to canvas pixel coordinates
 * 
 * @param lat - Latitude
 * @param lon - Longitude
 * @param zoom - Current map zoom level
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param mapCenter - [lat, lon] of map center
 * @returns [x, y] pixel coordinates on canvas
 */
export function latLonToCanvasPixel(
    lat: number,
    lon: number,
    zoom: number,
    canvasWidth: number,
    canvasHeight: number,
    mapCenter: [number, number]
): [number, number] {
    const [centerLat, centerLon] = mapCenter;
    
    // Calculate scale based on zoom level
    const scale = TILE_SIZE * Math.pow(2, zoom);
    
    // Convert point and center to normalized coordinates (0-1)
    const pointX = lonToX(lon);
    const pointY = latToY(lat);
    const centerX = lonToX(centerLon);
    const centerY = latToY(centerLat);
    
    // Calculate pixel offset from center
    const deltaX = (pointX - centerX) * scale;
    const deltaY = (pointY - centerY) * scale;
    
    // Convert to canvas coordinates (center of canvas is origin)
    const canvasX = canvasWidth / 2 + deltaX;
    const canvasY = canvasHeight / 2 + deltaY;
    
    return [canvasX, canvasY];
}

/**
 * Convert canvas pixel coordinates to lat/lon
 * 
 * @param x - Canvas X coordinate
 * @param y - Canvas Y coordinate
 * @param zoom - Current map zoom level
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param mapCenter - [lat, lon] of map center
 * @returns [lat, lon] coordinates
 */
export function canvasPixelToLatLon(
    x: number,
    y: number,
    zoom: number,
    canvasWidth: number,
    canvasHeight: number,
    mapCenter: [number, number]
): [number, number] {
    const [centerLat, centerLon] = mapCenter;
    
    const scale = TILE_SIZE * Math.pow(2, zoom);
    
    const centerX = lonToX(centerLon);
    const centerY = latToY(centerLat);
    
    // Calculate normalized delta from canvas center
    const deltaX = (x - canvasWidth / 2) / scale;
    const deltaY = (y - canvasHeight / 2) / scale;
    
    // Calculate point's normalized coordinates
    const pointX = centerX + deltaX;
    const pointY = centerY + deltaY;
    
    // Convert back to lat/lon
    const lon = pointX * 360 - 180;
    const lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((0.5 - pointY) * 2 * Math.PI)) - Math.PI / 2);
    
    return [lat, lon];
}
