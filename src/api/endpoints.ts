const API_BASE_URL = import.meta.env.API_BASE_URL || 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  routes: () => `${API_BASE_URL}/routes`,
  stations: () => `${API_BASE_URL}/stations`,
  routeNodes: (routeId: number) => `${API_BASE_URL}/routenodes/${routeId}`,
  vehicles: (rids: string) => `${API_BASE_URL}/vehicles/${encodeURIComponent(rids)}`,
  vehicleForecasts: (vehicleId: string) => `${API_BASE_URL}/forecasts/vehicle/${vehicleId}`,
  stationForecasts: (stationId: number) => `${API_BASE_URL}/forecasts/station/${stationId}`,
} as const;
