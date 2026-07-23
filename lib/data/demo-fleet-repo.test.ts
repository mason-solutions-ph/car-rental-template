import { describe, expect, it } from "vitest";
import {
  createDemoFleetRepo,
  filterDemoPublishedCars,
} from "@/lib/data/demo-fleet-repo";

describe("createDemoFleetRepo", () => {
  it("lists published cars with mode demo", async () => {
    const repo = createDemoFleetRepo();
    expect(repo.mode).toBe("demo");
    const page = await repo.listPublishedCars({ pageSize: 3 });
    expect(page.cars.length).toBeLessThanOrEqual(3);
    expect(page.total).toBeGreaterThan(0);
    expect(page.cars.every((c) => c.is_published)).toBe(true);
  });

  it("filters by class", async () => {
    const repo = createDemoFleetRepo();
    const page = await repo.listPublishedCars({
      class: ["suv"],
      pageSize: 50,
    });
    expect(page.cars.every((c) => c.class === "suv")).toBe(true);
  });

  it("getPublishedCarBySlug", async () => {
    const repo = createDemoFleetRepo();
    const car = await repo.getPublishedCarBySlug("toyota-vios");
    expect(car?.name).toMatch(/Vios/i);
    expect(car?.car_images?.length).toBeGreaterThan(0);
  });

  it("listPublishedCarSlugs", async () => {
    const repo = createDemoFleetRepo();
    const slugs = await repo.listPublishedCarSlugs();
    expect(slugs).toContain("toyota-vios");
  });
});

describe("filterDemoPublishedCars", () => {
  it("sorts by price ascending", () => {
    const list = filterDemoPublishedCars({ sort: "price_asc" });
    for (let i = 1; i < list.length; i++) {
      expect(list[i]!.daily_rate_cents).toBeGreaterThanOrEqual(
        list[i - 1]!.daily_rate_cents
      );
    }
  });
});

/** Parity cases for FleetRepo filter interface (demo adapter). */
describe("Fleet filter parity (demo)", () => {
  it("price_desc is reverse of price_asc order by rate", async () => {
    const repo = createDemoFleetRepo();
    const asc = await repo.listPublishedCars({
      sort: "price_asc",
      pageSize: 50,
    });
    const desc = await repo.listPublishedCars({
      sort: "price_desc",
      pageSize: 50,
    });
    expect(desc.cars.map((c) => c.id)).toEqual(
      [...asc.cars].reverse().map((c) => c.id)
    );
  });

  it("transmission filter narrows set", async () => {
    const repo = createDemoFleetRepo();
    const all = await repo.listPublishedCars({ pageSize: 50 });
    const auto = await repo.listPublishedCars({
      transmission: "automatic",
      pageSize: 50,
    });
    expect(auto.cars.length).toBeLessThanOrEqual(all.cars.length);
    expect(auto.cars.every((c) => c.transmission === "automatic")).toBe(true);
  });

  it("minPrice in centavos excludes cheaper cars", async () => {
    const repo = createDemoFleetRepo();
    const page = await repo.listPublishedCars({
      minPrice: 5_000_00,
      pageSize: 50,
    });
    expect(page.cars.every((c) => c.daily_rate_cents >= 5_000_00)).toBe(true);
  });
});
