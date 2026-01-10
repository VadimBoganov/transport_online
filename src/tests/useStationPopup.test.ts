import { renderHook, act } from "@testing-library/react";
import { useStationPopup } from "@/hooks/useStationPopup";
import type { Station } from "@/hooks/useStations";

const mockStation = { id: 1, name: "Test", lat: 60, lng: 30 } as Station;

test("opens forecast-selected station via openForecastStationPopup", () => {
    const { result } = renderHook(() =>
        useStationPopup({
            selectedStationFromProps: null,
            onDeselect: jest.fn(),
        })
    );

    act(() => {
        result.current.openForecastStationPopup(mockStation);
    });

    expect(result.current.activeSelectedStation).toEqual(mockStation);
});

test("closeStationPopup resets state and calls onDeselect", () => {
    const onDeselect = jest.fn();
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

// test("resets forecast station when prop station appears", () => {
//     const { result, rerender } = renderHook(
//         ({ selectedStationFromProps }) =>
//             useStationPopup({
//                 selectedStationFromProps,
//                 onDeselect: jest.fn(),
//             }),
//         { initialProps: { selectedStationFromProps: null } }
//     );

//     act(() => {
//         result.current.openForecastStationPopup(mockStation);
//     });

//     rerender({ selectedStationFromProps: mockStation });

//     expect(result.current.activeSelectedStation).toEqual(mockStation);
// });
