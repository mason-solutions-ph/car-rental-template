-- Fleet photography bucket (public read, admin write)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'car-images',
  'car-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "car_images_storage_public_read"
on storage.objects for select
using (bucket_id = 'car-images');

create policy "car_images_storage_admin_insert"
on storage.objects for insert
with check (
  bucket_id = 'car-images'
  and public.is_admin()
);

create policy "car_images_storage_admin_update"
on storage.objects for update
using (
  bucket_id = 'car-images'
  and public.is_admin()
)
with check (
  bucket_id = 'car-images'
  and public.is_admin()
);

create policy "car_images_storage_admin_delete"
on storage.objects for delete
using (
  bucket_id = 'car-images'
  and public.is_admin()
);
