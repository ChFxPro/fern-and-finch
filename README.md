# Fern & Finch

A nature-forward digital shop for original art, thrifted finds, and handmade work. The storefront is a static React site hosted on GitHub Pages. Supabase provides the catalog, product-image storage, row-level security, and password-free owner sign-in.

## Run locally

1. Copy `.env.example` to `.env` and add the Supabase project URL and publishable key.
2. Install dependencies with `npm install`.
3. Start the site with `npm run dev`.
4. Open `http://localhost:5173`.

Without Supabase variables, the public storefront uses the sample catalog so design work remains easy. Maker Studio stays read-only until Supabase is connected.

## Supabase setup

The database definition lives in `supabase/migrations`. It creates:

- `products`, with public access only to active listings;
- `store_admins`, which controls who can publish and edit;
- a public `product-images` bucket with admin-only uploads;
- seed listings for the first storefront view.

After applying the migration, add the shop owner's authenticated user ID to `public.store_admins`. Never place a Supabase secret or service-role key in the site or GitHub repository.

## iPhone publishing

Open the live store and choose **Maker Studio**. The owner receives a password-free sign-in link by email. **Take or choose a photo** opens the rear camera on supported iPhones. Before upload, the browser rotates the camera image correctly, resizes its longest edge to 1800 pixels, and converts it to a high-quality JPEG for a consistent catalog.

Use **Manage shop** to edit listing details, change price or quantity, feature a piece, hide a sold item, or return it to the storefront.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` publishes every push to `main`. The repository needs these two Actions variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

GitHub Pages must use **GitHub Actions** as its publishing source. The production base path is `/fern-and-finch/`.

## Stripe

Checkout is intentionally marked as coming soon. Stripe Checkout and its signed webhook will be added as Supabase Edge Functions so secret keys never enter the browser and inventory changes only after confirmed payment.

## Checks

Run `npm run validate` before publishing. This builds the same static site used by GitHub Pages.
