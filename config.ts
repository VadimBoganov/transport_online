import type { TransportType } from '@/types/transport';

export interface RouteConfig {
  title: string;
  type: TransportType;
  color: string;
}

export interface AppConfig {
  map: {
    lat: number;
    lng: number;
    zoom: number;
    stationSelectZoom: number;
  };
  routes: RouteConfig[];
  routeIconSize: number;
  routeLineWeight: number;
  vehicleMarkers: {
    borderColor: string;
    lowFloorBorderColor: string;
  };
}

const config: AppConfig = {
  map: {
    lat: 54.628723,
    lng: 39.716815,
    zoom: 15,
    stationSelectZoom: 15,
  },
  routes: [
    {
      title: 'Автобусы',
      type: 'А',
      color: 'green',
    },
    {
      title: 'Троллейбусы',
      type: 'Т',
      color: 'blue',
    },
    // {
    //   title: 'Маршрутные такси',
    //   type: 'М',
    //   color: '#ff6a00',
    // },
  ],
  routeIconSize: 18,
  routeLineWeight: 3,
  vehicleMarkers: {
    borderColor: '#00a8ff',
    lowFloorBorderColor: 'white',
  },
};

export default config;