import { useState, useEffect, useRef } from 'react';
import type { StationForecast } from '@/types/transport';
import { getWebSocketClient } from '@/api/websocketClient';

interface UseStationForecastProps {
    stationId: number | null;
}

export default function useStationForecast({ stationId }: UseStationForecastProps) {
    const [data, setData] = useState<StationForecast[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const wsClientRef = useRef(getWebSocketClient());
    const handlerRef = useRef<((data: StationForecast[]) => void) | null>(null);

    useEffect(() => {
        if (!stationId) {
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

                const handler = (forecastData: StationForecast[]) => {
                    if (isMounted) {
                        setData(Array.isArray(forecastData) ? forecastData : []);
                        setIsLoading(false);
                    }
                };

                handlerRef.current = handler;
                wsClient.subscribeStationForecast(stationId, handler);
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
    }, [stationId]);

    return { data, isLoading, error };
}