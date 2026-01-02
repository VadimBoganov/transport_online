export type TransportType = 'А' | 'Т' | 'М';

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
    stationVisibleZoom: number;
  };
  routes: RouteConfig[];
  routeIconSize: number;
  routeLineWeight: number;
}

const config: AppConfig = {
  map: {
    lat: 54.628723,
    lng: 39.716815,
    zoom: 15,
    stationVisibleZoom: 15,
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
    {
      title: 'Маршрутные такси',
      type: 'М',
      color: '#ff6a00',
    },
  ],
  routeIconSize: 18,
  routeLineWeight: 3,
};

export default config;