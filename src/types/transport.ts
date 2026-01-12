export type TransportType = 'А' | 'Т' | 'М';

export interface Route {
  id: number;
  name: string;
  num: string;
  type: TransportType;
  fromst: string;
  tost: string;
}

export interface RouteNode {
    lat: number;
    lng: number;
}

export interface Station {
  id: number;
  name: string;
  descr: string;
  lat: number;
  lng: number;
  type: number;
}

export interface SelectedRoute {
  id: number;
  type: TransportType;
}

export interface SelectedStation {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

export interface SelectedVehicle {
  id: string;
  rid: number;
  rtype: TransportType;
}

export interface VehiclePosition {
    maxk: number;
    anims: Animation[];
}

export interface Animation {
    id: string;
    lat: number;
    lon: number;
    rid: number;
    dir: number;
    speed: number;
    lasttime: string;
    gos_num: string;
    rnum: string;
    rtype: string;
    low_floor: boolean;
}

export interface Forecast {
    arrt: number;          
    where: string;         
    vehid: string;         
    rid: number;           
    rtype: 'А' | 'Т' | 'М'; 
    rnum: string;          
    lastst: string;        
}

export interface VehicleForecast {
    arrt: number;
    stid: number;
    stname: string;
    stdescr: string;
    lat0: number;
    lng0: number;
    lat1: number;
    lng1: number;
}