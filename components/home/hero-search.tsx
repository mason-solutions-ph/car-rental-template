import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Location } from "@/types";

export function HeroSearch({ locations }: { locations: Location[] }) {
  return (
    <form
      action="/cars"
      method="get"
      className="bg-card border-border flex w-full flex-col gap-4 rounded-xl border p-4 shadow-sm sm:p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location">Pickup</Label>
          <select
            id="location"
            name="location"
            defaultValue=""
            className="border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm"
          >
            <option value="">Any location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.slug}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="from">From</Label>
          <Input id="from" name="from" type="date" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="to">To</Label>
          <Input id="to" name="to" type="date" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="class">Class</Label>
          <select
            id="class"
            name="class"
            defaultValue=""
            className="border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm"
          >
            <option value="">Any class</option>
            <option value="economy">Economy</option>
            <option value="compact">Compact</option>
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="luxury">Luxury</option>
            <option value="sports">Sports</option>
            <option value="van">Van</option>
          </select>
        </div>
      </div>
      <Button type="submit" className="w-full sm:w-auto sm:self-end">
        Search cars
      </Button>
    </form>
  );
}
