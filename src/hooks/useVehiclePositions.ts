import { useState, useEffect, useRef } from 'react';
import type { VehiclePosition } from '@/types/transport';
import { getWebSocketClient } from '@/api/websocketClient';

export function useVehiclePositions(rids: string | null) {
    const [data, setData] = useState<VehiclePosition | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const wsClientRef = useRef(getWebSocketClient());
    const handlerRef = useRef<((data: VehiclePosition) => void) | null>(null);
    const currentRidsRef = useRef<string | null>(null);

    useEffect(() => {
        if (!rids) {
            setIsLoading(false);
            setData(null);
            currentRidsRef.current = null;
            return;
        }

        const wsClient = wsClientRef.current;
        let isMounted = true;

        const connectAndSubscribe = async () => {
            try {
                setIsLoading(true);
                setError(null);

                if (currentRidsRef.current && currentRidsRef.current !== rids && handlerRef.current) {
                    wsClient.off('vehicles_update', handlerRef.current);
                }

                currentRidsRef.current = rids;

                if (!wsClient.isConnected()) {
                    await wsClient.connect();
                    let attempts = 0;
                    while (!wsClient.isConnected() && attempts < 50) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        attempts++;
                    }
                }

                const handler = (vehicleData: VehiclePosition) => {
                    if (isMounted && currentRidsRef.current === rids) {
                        setData(vehicleData);
                        setIsLoading(false);
                    }
                };

                handlerRef.current = handler;

                wsClient.subscribeVehicles(rids, handler);
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
            if (handlerRef.current) {
                wsClient.off('vehicles_update', handlerRef.current);
            }
        };
    }, [rids]);

    return { data, isLoading, error };
}
