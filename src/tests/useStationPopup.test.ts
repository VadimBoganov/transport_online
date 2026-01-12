import { renderHook, act } from "@testing-library/react";
import { useStationPopup } from "@/hooks/useStationPopup";
import type { Station } from "@/types/transport";

const mockStation = { id: 1, name: "Test", lat: 60, lng: 30 } as Station;

test("opens forecast-selected station via openForecastStationPopup", () => {
    const { result } = renderHook(() =>
        useStationPopup({
            selectedStationFromProps: null,
            onDeselect: vi.fn(),
        })
    );

    act(() => {
        result.current.openForecastStationPopup(mockStation);
    });

    expect(result.current.activeSelectedStation).toEqual(mockStation);
});

test("closeStationPopup resets state and calls onDeselect", () => {
    const onDeselect = vi.fn();
    const { result } = renderHook(() =>
        useStationPopup({
            selectedStationFromProps: null,
            onDeselect,
        })
    );

    act(() => {
        result.current.openForecastStationPopup(mockStation);
    });

    act(() => {
        result.current.closeStationPopup();
    });

    expect(result.current.activeSelectedStation).toBeNull();
    expect(onDeselect).toHaveBeenCalled();
});
