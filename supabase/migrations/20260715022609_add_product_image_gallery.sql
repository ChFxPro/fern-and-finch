alter table public.products
  add column if not exists dimensions text not null default '';

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  image_url text not null,
  storage_path text,
  alt_text text not null default '',
  position smallint not null default 0 check (position between 0 and 5),
  created_at timestamptz not null default now(),
  unique (product_id, position)
);

alter table public.product_images enable row level security;

grant select on public.product_images to anon, authenticated;
grant insert, update, delete on public.product_images to authenticated;
revoke insert, update, delete on public.product_images from anon;

drop policy if exists "Public can view active product images" on public.product_images;
create policy "Public can view active product images"
on public.product_images for select
to anon
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.active = true
  )
);

drop policy if exists "Signed in users can view allowed product images" on public.product_images;
create policy "Signed in users can view allowed product images"
on public.product_images for select
to authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and (products.active = true or public.is_store_admin())
  )
);

drop policy if exists "Store admins can add product images" on public.product_images;
create policy "Store admins can add product images"
on public.product_images for insert
to authenticated
with check (public.is_store_admin());

drop policy if exists "Store admins can update product images" on public.product_images;
create policy "Store admins can update product images"
on public.product_images for update
to authenticated
using (public.is_store_admin())
with check (public.is_store_admin());

drop policy if exists "Store admins can delete product images" on public.product_images;
create policy "Store admins can delete product images"
on public.product_images for delete
to authenticated
using (public.is_store_admin());

insert into public.product_images (product_id, image_url, alt_text, position)
select products.id, products.image, products.title, 0
from public.products
where products.image <> ''
on conflict (product_id, position) do nothing;

create index if not exists product_images_product_position_idx
  on public.product_images (product_id, position);
