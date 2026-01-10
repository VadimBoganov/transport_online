import { useEffect, useMemo, useState } from "react";
import type { Station } from "./useStations";

interface UseStationPopupProps {
    selectedStationFromProps: Station | null;
    onDeselect: () => void;
}

export const useStationPopup = ({
    selectedStationFromProps,
    onDeselect,
}: UseStationPopupProps) => {
    const [forecastSelectedStation, setForecastSelectedStation] = useState<Station | null>(null);

    const activeSelectedStation = useMemo(() => {
        if (selectedStationFromProps) return selectedStationFromProps;
        return forecastSelectedStation;
    }, [selectedStationFromProps, forecastSelectedStation]);

    const closeStationPopup = () => {
        setForecastSelectedStation(null);
        onDeselect();
    };

    const openForecastStationPopup = (station: Station) => {
        setForecastSelectedStation(station);
    };

    useEffect(() => {
        if (selectedStationFromProps) {
            setForecastSelectedStation(null);
        }
    }, [selectedStationFromProps]);

    return {
        activeSelectedStation,
        closeStationPopup,
        openForecastStationPopup,
    };
};
