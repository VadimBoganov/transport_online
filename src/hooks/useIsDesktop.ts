import { useEffect, useState } from "react";

const DESKTOP_MIN_WIDTH = 1280;

export function useIsDesktop(): boolean {
    const [isDesktop, setIsDesktop] = useState(() => {
        if (typeof window === "undefined") {
            return true;
        }
        return window.innerWidth >= DESKTOP_MIN_WIDTH;
    });

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= DESKTOP_MIN_WIDTH);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return isDesktop;
}

