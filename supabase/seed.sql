-- Run after migrations. Fixed UUIDs for easy reference.
-- Locations
insert into public.locations (id, slug, name, city, region, country, address_line1, hours_note, is_published, sort_order) values
  ('11111111-1111-4111-8111-111111111111', 'mnl-naia-t3', 'NAIA Terminal 3', 'Pasay', 'Metro Manila', 'PH', 'Andrews Ave', 'Daily 6am–10pm', true, 1),
  ('22222222-2222-4222-8222-222222222222', 'bgc-hub', 'BGC Pickup Hub', 'Taguig', 'Metro Manila', 'PH', '26th St cor 7th Ave', 'Daily 8am–8pm', true, 2),
  ('33333333-3333-4333-8333-333333333333', 'ceb-airport', 'Mactan-Cebu Airport', 'Lapu-Lapu', 'Cebu', 'PH', 'Airport Rd', 'Daily 7am–9pm', true, 3);

-- Cars (daily_rate_cents = centavos)
insert into public.cars (
  id, slug, name, make, model, year, class, transmission, fuel_type, seats, doors,
  luggage_capacity, daily_rate_cents, currency, description, features, hero_image_url,
  status, is_published, default_location_id
) values
  (
    'a0000000-0000-4000-8000-000000000001', 'toyota-vios', 'Toyota Vios 1.3 E', 'Toyota', 'Vios', 2024, 'economy', 'automatic', 'gasoline', 5, 4, 2,
    180000, 'PHP', 'Reliable city hatch-sedan for daily drives and airport runs.',
    array['Bluetooth','USB','Rear camera'],
    'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1200&q=80',
    'available', true, '11111111-1111-4111-8111-111111111111'
  ),
  (
    'a0000000-0000-4000-8000-000000000002', 'honda-city', 'Honda City RS', 'Honda', 'City', 2024, 'compact', 'automatic', 'gasoline', 5, 4, 2,
    220000, 'PHP', 'Sporty compact sedan with strong fuel economy.',
    array['Apple CarPlay','Android Auto','Cruise control'],
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80',
    'available', true, '22222222-2222-4222-8222-222222222222'
  ),
  (
    'a0000000-0000-4000-8000-000000000003', 'toyota-camry', 'Toyota Camry 2.5V', 'Toyota', 'Camry', 2023, 'sedan', 'automatic', 'hybrid', 5, 4, 3,
    350000, 'PHP', 'Comfortable executive sedan for longer trips.',
    array['Hybrid','Leather seats','Sunroof'],
    'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=1200&q=80',
    'available', true, '11111111-1111-4111-8111-111111111111'
  ),
  (
    'a0000000-0000-4000-8000-000000000004', 'toyota-fortuner', 'Toyota Fortuner G', 'Toyota', 'Fortuner', 2024, 'suv', 'automatic', 'diesel', 7, 5, 4,
    450000, 'PHP', '7-seater SUV ready for family road trips.',
    array['4x4','Third row','Push start'],
    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80',
    'available', true, '22222222-2222-4222-8222-222222222222'
  ),
  (
    'a0000000-0000-4000-8000-000000000005', 'mitsubishi-montero', 'Mitsubishi Montero Sport', 'Mitsubishi', 'Montero Sport', 2023, 'suv', 'automatic', 'diesel', 7, 5, 4,
    420000, 'PHP', 'Rugged midsize SUV with confident road presence.',
    array['Diesel','Roof rails','Parking sensors'],
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80',
    'available', true, '33333333-3333-4333-8333-333333333333'
  ),
  (
    'a0000000-0000-4000-8000-000000000006', 'bmw-5-series', 'BMW 520i', 'BMW', '5 Series', 2023, 'luxury', 'automatic', 'gasoline', 5, 4, 3,
    850000, 'PHP', 'Executive luxury sedan with refined dynamics.',
    array['Leather','Nav','Premium audio'],
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80',
    'available', true, '22222222-2222-4222-8222-222222222222'
  ),
  (
    'a0000000-0000-4000-8000-000000000007', 'mercedes-e-class', 'Mercedes-Benz E 200', 'Mercedes-Benz', 'E-Class', 2023, 'luxury', 'automatic', 'gasoline', 5, 4, 3,
    900000, 'PHP', 'Iconic luxury sedan for airport transfers and events.',
    array['Ambient lighting','MBUX','Driver assist'],
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=80',
    'available', true, '11111111-1111-4111-8111-111111111111'
  ),
  (
    'a0000000-0000-4000-8000-000000000008', 'ford-mustang', 'Ford Mustang EcoBoost', 'Ford', 'Mustang', 2022, 'sports', 'automatic', 'gasoline', 4, 2, 2,
    750000, 'PHP', 'American muscle coupe for weekend thrills.',
    array['Sport mode','Leather','Sync 3'],
    'https://images.unsplash.com/photo-1584345604476-8ec5f82d4963?w=1200&q=80',
    'available', true, '22222222-2222-4222-8222-222222222222'
  ),
  (
    'a0000000-0000-4000-8000-000000000009', 'porsche-911', 'Porsche 911 Carrera', 'Porsche', '911', 2022, 'sports', 'automatic', 'gasoline', 4, 2, 1,
    1500000, 'PHP', 'Timeless sports icon. Limited availability.',
    array['PDK','Sport Chrono','Premium sound'],
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80',
    'available', true, '22222222-2222-4222-8222-222222222222'
  ),
  (
    'a0000000-0000-0000-0000-000000000010', 'toyota-hiace', 'Toyota Hiace Commuter', 'Toyota', 'Hiace', 2023, 'van', 'manual', 'diesel', 15, 4, 6,
    500000, 'PHP', 'Group transport for tours and corporate shuttles.',
    array['High roof','Dual AC','Diesel'],
    'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=1200&q=80',
    'available', true, '11111111-1111-4111-8111-111111111111'
  );

insert into public.car_images (car_id, url, alt, sort_order)
select id, hero_image_url, name, 0 from public.cars where is_published = true;
