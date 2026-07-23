export type UserRole = "customer" | "admin";
export type CarStatus = "available" | "maintenance" | "retired";
export type CarClass =
  | "economy"
  | "compact"
  | "sedan"
  | "suv"
  | "luxury"
  | "sports"
  | "van";
export type Transmission = "automatic" | "manual";
export type FuelType = "gasoline" | "diesel" | "hybrid" | "electric";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled";
export type PaymentStatus =
  | "unpaid"
  | "paid"
  | "failed"
  | "refunded"
  | "expired";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  license_number: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Location = {
  id: string;
  slug: string;
  name: string;
  city: string;
  region: string | null;
  country: string;
  address_line1: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  hours_note: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CarImage = {
  id: string;
  car_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
  created_at: string;
};

export type Car = {
  id: string;
  slug: string;
  name: string;
  make: string;
  model: string;
  trim: string | null;
  year: number;
  class: CarClass;
  transmission: Transmission;
  fuel_type: FuelType;
  seats: number;
  doors: number;
  luggage_capacity: number | null;
  daily_rate_cents: number;
  currency: string;
  description: string | null;
  features: string[];
  hero_image_url: string | null;
  status: CarStatus;
  is_published: boolean;
  default_location_id: string | null;
  mileage_limit_per_day: number | null;
  created_at: string;
  updated_at: string;
};

export type CarWithImages = Car & {
  car_images: CarImage[];
  default_location?: Location | null;
};

export type Booking = {
  id: string;
  reference_code: string;
  customer_id: string;
  car_id: string;
  pickup_location_id: string;
  dropoff_location_id: string;
  pickup_at: string;
  dropoff_at: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  daily_rate_cents: number;
  rental_days: number;
  subtotal_cents: number;
  fees_cents: number;
  total_cents: number;
  currency: string;
  paymongo_checkout_session_id: string | null;
  paymongo_payment_intent_id: string | null;
  paymongo_payment_id: string | null;
  paid_at: string | null;
  amount_paid_cents: number | null;
  customer_note: string | null;
  admin_note: string | null;
  driver_full_name: string | null;
  driver_phone: string | null;
  driver_license_number: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingWithRelations = Booking & {
  car: Pick<Car, "id" | "name" | "slug" | "hero_image_url" | "daily_rate_cents">;
  pickup_location: Pick<Location, "id" | "name" | "city" | "slug">;
  dropoff_location: Pick<Location, "id" | "name" | "city" | "slug">;
};

export type CarFilters = {
  q?: string;
  class?: CarClass[];
  transmission?: Transmission;
  fuel?: FuelType;
  seats?: number;
  minPrice?: number; // centavos
  maxPrice?: number; // centavos
  location?: string; // slug or id
  sort?: "price_asc" | "price_desc" | "name" | "newest";
  page?: number;
  pageSize?: number;
};
