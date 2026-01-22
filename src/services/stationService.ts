import type { SelectedStation, Station } from "@/types/transport";

export interface StationPopupState {
    activeStation: SelectedStation | null;
    open: (station: SelectedStation) => void;
    close: () => void;
}

export const shouldOpenStationPopup = (
    newStation: SelectedStation | null,
    currentActive: SelectedStation | null
): boolean => {
    if (!newStation) return false;
    if (currentActive?.id === newStation.id) return false;
    return true;
};

export const filterStationsBySearch = (
    stations: Station[] | undefined,
    searchTerm: string
): Station[] => {
    if (!stations) return [];
    const term = searchTerm.toLowerCase();
    return stations.filter((station) => station.name.toLowerCase().includes(term));
};
