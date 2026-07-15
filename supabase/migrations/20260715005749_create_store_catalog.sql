create extension if not exists pgcrypto;

create table public.store_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.store_admins enable row level security;
revoke all on public.store_admins from anon, authenticated;

create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.store_admins where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_store_admin() from public;
grant execute on function public.is_store_admin() to authenticated;

create table public.products (
  id text primary key,
  title text not null check (char_length(title) between 1 and 120),
  category text not null check (category in ('Art', 'Found', 'Handmade')),
  price numeric(10,2) not null check (price > 0),
  description text not null default '',
  story text not null default '',
  materials text not null default '',
  inventory integer not null default 1 check (inventory >= 0),
  featured boolean not null default false,
  active boolean not null default true,
  image text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

create policy "Anyone can view active products"
on public.products for select
to anon, authenticated
using (active);

create policy "Store admins can view hidden products"
on public.products for select
to authenticated
using ((select public.is_store_admin()));

create policy "Store admins can create products"
on public.products for insert
to authenticated
with check ((select public.is_store_admin()));

create policy "Store admins can update products"
on public.products for update
to authenticated
using ((select public.is_store_admin()))
with check ((select public.is_store_admin()));

create policy "Store admins can delete products"
on public.products for delete
to authenticated
using ((select public.is_store_admin()));

create or replace function public.set_product_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_product_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Store admins can upload product images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images' and (select public.is_store_admin()));

create policy "Store admins can update product images"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images' and (select public.is_store_admin()))
with check (bucket_id = 'product-images' and (select public.is_store_admin()));

create policy "Store admins can delete product images"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images' and (select public.is_store_admin()));

insert into public.products (id, title, category, price, description, story, materials, inventory, featured, active, image) values
('woodland-study-4', 'Woodland Study No. 4', 'Art', 86, 'An original mixed-media study of the quiet edge where meadow meets woods.', 'Painted in small layers over a slow autumn week.', 'Gouache, graphite, handmade cotton paper', 1, true, true, 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1400&q=88'),
('brass-songbird', 'Little Studio Cat Print', 'Art', 42, 'A soft, watchful portrait print for a small wall, reading nook, or bedside.', 'Made from a quiet studio companion who always finds the warmest seat.', 'Archival pigment print on cotton paper', 1, true, true, 'https://images.unsplash.com/photo-1591871937573-74dbba515c4c?auto=format&fit=crop&w=1400&q=88'),
('market-tote', 'Forest Green Handbag', 'Found', 64, 'A structured vintage handbag in the deepest woodland green.', 'Found in beautiful condition, with just enough patina to tell its story.', 'Vintage leather and brass hardware', 2, false, true, 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1400&q=88'),
('pressed-fern-frame', 'Kitchen Fern', 'Found', 58, 'A cheerful little fern settled into a simple, timeworn pot.', 'Propagated from the studio plant that refuses to stop growing.', 'Living fern in a vintage ceramic planter', 1, false, true, 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1400&q=88'),
('little-wren-vessel', 'Speckled Stoneware Set', 'Handmade', 48, 'A softly mismatched family of cups and vessels in warm, milky glaze.', 'Thrown and pinched in small batches, with every variation left in place.', 'Speckled stoneware and food-safe glaze', 1, false, true, 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1400&q=88'),
('moss-glass-bottle', 'Cedar & Moss Candle', 'Handmade', 36, 'A dark, woodsy candle poured into an amber glass tumbler.', 'Made for rainy afternoons, old books, and a kettle on the stove.', 'Soy wax, cedarwood and oakmoss fragrance', 1, false, true, 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1400&q=88');
