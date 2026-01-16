export interface ViewportBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

export function calculateViewportBounds(
    center: [number, number],
    zoom: number,
    width: number,
    height: number,
    padding: number = 0.01
): ViewportBounds {
    const [centerLat, centerLng] = center;
    
    const worldPixels = 256 * Math.pow(2, zoom);
    
    const degreesPerPixelLat = 180 / worldPixels;
    
    const latRad = (centerLat * Math.PI) / 180;
    const degreesPerPixelLng = (360 / worldPixels) / Math.cos(latRad);
    
    const latRange = (height / 2) * degreesPerPixelLat;
    const lngRange = (width / 2) * degreesPerPixelLng;
    
    return {
        north: centerLat + latRange + padding,
        south: centerLat - latRange - padding,
        east: centerLng + lngRange + padding,
        west: centerLng - lngRange - padding,
    };
}

export function isPointInViewport(
    lat: number,
    lng: number,
    bounds: ViewportBounds
): boolean {
    const normalizedLat = lat / 1e6;
    const normalizedLng = lng / 1e6;
    
    return (
        normalizedLat >= bounds.south &&
        normalizedLat <= bounds.north &&
        normalizedLng >= bounds.west &&
        normalizedLng <= bounds.east
    );
}

export function isPointInMapBounds(
    lat: number,
    lng: number,
    bounds: { ne: [number, number]; sw: [number, number] }
): boolean {
    const normalizedLat = lat / 1e6;
    const normalizedLng = lng / 1e6;
    
    const [neLat, neLng] = bounds.ne;
    const [swLat, swLng] = bounds.sw;
    
    return (
        normalizedLat >= swLat &&
        normalizedLat <= neLat &&
        normalizedLng >= swLng &&
        normalizedLng <= neLng
    );
}
