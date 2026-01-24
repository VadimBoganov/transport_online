import { useState, useEffect, useRef } from 'react';
import type { VehicleForecast } from '@/types/transport';
import { getWebSocketClient } from '@/api/websocketClient';

interface UseVehicleForecastsProps {
    vid: string | null;
}

export default function useVehicleForecasts({ vid }: UseVehicleForecastsProps) {
    const [data, setData] = useState<VehicleForecast[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const wsClientRef = useRef(getWebSocketClient());
    const handlerRef = useRef<((data: VehicleForecast[]) => void) | null>(null);

    useEffect(() => {
        if (!vid) {
            setIsLoading(false);
            setData([]);
            return;
        }

        const wsClient = wsClientRef.current;
        let isMounted = true;

        const connectAndSubscribe = async () => {
            try {
                setIsLoading(true);
                setError(null);

                if (!wsClient.isConnected()) {
                    await wsClient.connect();
                }

                const handler = (forecastData: VehicleForecast[]) => {
                    if (isMounted) {
                        setData(Array.isArray(forecastData) ? forecastData : []);
                        setIsLoading(false);
                    }
                };

                handlerRef.current = handler;
                wsClient.subscribeVehicleForecast(vid, handler);
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error('Failed to connect to WebSocket'));
                    setIsLoading(false);
                }
            }
        };

        connectAndSubscribe();

        return () => {
            isMounted = false;
        };
    }, [vid]);

    return { data, isLoading, error };
}