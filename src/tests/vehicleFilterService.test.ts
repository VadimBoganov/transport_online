import { filterVehiclesBySelectedRoutes } from "@/services/vehicleFilterService";
import type { Animation, SelectedRoute } from "@/types/transport";

const vehicles = [
    { id: "1", rid: 1, rtype: "А", rnum: "1А" },
    { id: "2", rid: 2, rtype: "Т", rnum: "2Т" },
    { id: "3", rid: 3, rtype: "М", rnum: "3М" },
] as Animation[];

const selectedRoutes = [{ id: 1, type: "А" }, { id: 2, type: "Т" }] as SelectedRoute[];

test("filters vehicles by selected routes", () => {
    const result = filterVehiclesBySelectedRoutes(vehicles, selectedRoutes);
    expect(result).toEqual([
        vehicles[0], 
        vehicles[1], 
    ]);
});

test("returns all vehicles if no routes selected", () => {
    const result = filterVehiclesBySelectedRoutes(vehicles, []);
    expect(result).toEqual(vehicles);
});
