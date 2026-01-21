import { useEffect, useState } from "react";

export const useDelayedLoading = (isLoading: boolean, delay: number = 1000): boolean => {
    const [showLoading, setShowLoading] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            setShowLoading(false);
            return;
        }

        const timer = setTimeout(() => {
            setShowLoading(true);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [isLoading, delay]);

    return showLoading;
};
