-- Transcribed 1:1 from src/data/catalog.ts (CATEGORIES + DEFAULT_PRODUCTS).
-- The "all" / "best-sellers" pseudo-categories are UI-only filters and are
-- intentionally not rows here. The on_product_created trigger (0004) creates
-- each product's inventory row automatically - no separate insert needed.

insert into public.categories (id, name, image, accent, benefits, sort_order) values
  ('dip', 'Dip Pops', '/Assets/Assets/Dip.avif', '#A0724E',
    array['Calcium', '3g prebiotics', 'As low as 135 cal'], 1),
  ('lite', 'Lite Pops', '/Assets/Assets/Lite.avif', '#F28C28',
    array['No sugar added', 'Diabetic friendly', 'As low as 10 cal'], 2),
  ('premium', 'Premium Pops', '/Assets/Assets/Premium.avif', '#C9A86C',
    array['Calcium', 'Low fat', 'Real nuts', 'As low as 135 cal'], 3),
  ('juicy', 'Juicy Pops', '/Assets/Assets/Strawberry(with%20dalandan).avif', '#F08A8A',
    array['Lactose free', 'Low fat', '3g prebiotics', 'As low as 48 cal'], 4),
  ('specialty', 'Specialty Pops', '/Assets/Assets/Specialty.avif', '#A0724E',
    array['Calcium', '3g prebiotics', 'Low fat', '65–135 cal'], 5),
  ('milky', 'Milky Pops', '/Assets/Assets/Milky.avif', '#8FA86A',
    array['Calcium', 'Low fat', '3g prebiotics', 'As low as 65 cal'], 6);

insert into public.products (id, name, description, price, category_id, image, best_seller) values
  -- dip (75)
  ('dip-choco-banana', 'Choco Banana', 'Choco Banana Dip Pop from Picolé.', 75, 'dip', '/Assets/Assets/Dip.avif', true),
  ('dip-cookie-overload', 'Cookie Overload', 'Cookie Overload Dip Pop from Picolé.', 75, 'dip', '/Assets/Assets/Dip.avif', false),
  ('dip-corn-supreme', 'Corn Supreme', 'Corn Supreme Dip Pop from Picolé.', 75, 'dip', '/Assets/Assets/Dip.avif', false),
  ('dip-luscious-strawberry', 'Luscious Strawberry', 'Luscious Strawberry Dip Pop from Picolé.', 75, 'dip', '/Assets/Assets/Dip.avif', false),

  -- lite (45)
  ('lite-orange', 'Orange', 'Orange Lite Pop from Picolé.', 45, 'lite', '/Assets/Assets/Lite.avif', false),
  ('lite-almond-hazelnut', 'Almond Hazelnut', 'Almond Hazelnut Lite Pop from Picolé.', 45, 'lite', '/Assets/Assets/Lite.avif', false),
  ('lite-strawberry', 'Strawberry', 'Strawberry Lite Pop from Picolé.', 45, 'lite', '/Assets/Assets/Lite.avif', false),
  ('lite-double-choco', 'Double Choco', 'Double Choco Lite Pop from Picolé.', 45, 'lite', '/Assets/Assets/Lite.avif', true),
  ('lite-avocado', 'Avocado', 'Avocado Lite Pop from Picolé.', 45, 'lite', '/Assets/Assets/Lite.avif', false),

  -- premium (80)
  ('premium-pistachio', 'Pistachio', 'Pistachio Premium Pop from Picolé.', 80, 'premium', '/Assets/Assets/Premium.avif', true),
  ('premium-choco-mint', 'Choco Mint', 'Choco Mint Premium Pop from Picolé.', 80, 'premium', '/Assets/Assets/Premium.avif', false),
  ('premium-berries-and-dark-chocolate', 'Berries and Dark Chocolate', 'Berries and Dark Chocolate Premium Pop from Picolé.', 80, 'premium', '/Assets/Assets/Premium.avif', false),
  ('premium-belgian-chocolate', 'Belgian Chocolate', 'Belgian Chocolate Premium Pop from Picolé.', 80, 'premium', '/Assets/Assets/Premium.avif', true),

  -- juicy (50)
  ('juicy-strawberry', 'Strawberry', 'Strawberry Juicy Pop from Picolé.', 50, 'juicy', '/Assets/Assets/Strawberry(with%20dalandan).avif', true),
  ('juicy-lemon', 'Lemon', 'Lemon Juicy Pop from Picolé.', 50, 'juicy', '/Assets/Assets/Strawberry(with%20dalandan).avif', false),
  ('juicy-chili-tamarind', 'Chili Tamarind', 'Chili Tamarind Juicy Pop from Picolé.', 50, 'juicy', '/Assets/Assets/Strawberry(with%20dalandan).avif', false),
  ('juicy-buko', 'Buko', 'Buko Juicy Pop from Picolé.', 50, 'juicy', '/Assets/Assets/Strawberry(with%20dalandan).avif', false),
  ('juicy-green-mango', 'Green Mango', 'Green Mango Juicy Pop from Picolé.', 50, 'juicy', '/Assets/Assets/Strawberry(with%20dalandan).avif', false),
  ('juicy-lychee', 'Lychee', 'Lychee Juicy Pop from Picolé.', 50, 'juicy', '/Assets/Assets/Strawberry(with%20dalandan).avif', false),
  ('juicy-mango', 'Mango', 'Mango Juicy Pop from Picolé.', 50, 'juicy', '/Assets/Assets/Strawberry(with%20dalandan).avif', true),
  ('juicy-watermelon', 'Watermelon', 'Watermelon Juicy Pop from Picolé.', 50, 'juicy', '/Assets/Assets/Strawberry(with%20dalandan).avif', false),
  ('juicy-calamansi', 'Calamansi', 'Calamansi Juicy Pop from Picolé.', 50, 'juicy', '/Assets/Assets/Strawberry(with%20dalandan).avif', false),
  ('juicy-buko-lychee', 'Buko Lychee', 'Buko Lychee Juicy Pop from Picolé.', 50, 'juicy', '/Assets/Assets/Strawberry(with%20dalandan).avif', false),
  ('juicy-pineapple', 'Pineapple', 'Pineapple Juicy Pop from Picolé.', 50, 'juicy', '/Assets/Assets/Strawberry(with%20dalandan).avif', false),
  ('juicy-dalandan', 'Dalandan', 'Dalandan Juicy Pop from Picolé.', 50, 'juicy', '/Assets/Assets/Strawberry(with%20dalandan).avif', false),

  -- specialty (75)
  ('specialty-neopolitan', 'Neopolitan', 'Neopolitan Specialty Pop from Picolé.', 75, 'specialty', '/Assets/Assets/Specialty.avif', true),
  ('specialty-banana-split', 'Banana Split', 'Banana Split Specialty Pop from Picolé.', 75, 'specialty', '/Assets/Assets/Specialty.avif', false),
  ('specialty-sorbetes-trio', 'Sorbetes Trio', 'Sorbetes Trio Specialty Pop from Picolé.', 75, 'specialty', '/Assets/Assets/Specialty.avif', true),
  ('specialty-orange-n-cream', 'Orange n'' Cream', 'Orange n'' Cream Specialty Pop from Picolé.', 75, 'specialty', '/Assets/Assets/Specialty.avif', false),
  ('specialty-bubblegum', 'Bubblegum', 'Bubblegum Specialty Pop from Picolé.', 75, 'specialty', '/Assets/Assets/Specialty.avif', false),

  -- milky (65)
  ('milky-avocado', 'Avocado', 'Avocado Milky Pop from Picolé.', 65, 'milky', '/Assets/Assets/Milky.avif', true),
  ('milky-ube', 'Ube', 'Ube Milky Pop from Picolé.', 65, 'milky', '/Assets/Assets/Milky.avif', false),
  ('milky-cappucino', 'Cappucino', 'Cappucino Milky Pop from Picolé.', 65, 'milky', '/Assets/Assets/Milky.avif', false),
  ('milky-chocolate', 'Chocolate', 'Chocolate Milky Pop from Picolé.', 65, 'milky', '/Assets/Assets/Milky.avif', false),
  ('milky-red-bean', 'Red Bean', 'Red Bean Milky Pop from Picolé.', 65, 'milky', '/Assets/Assets/Milky.avif', false),
  ('milky-green-tea-matcha', 'Green Tea (Matcha)', 'Green Tea (Matcha) Milky Pop from Picolé.', 65, 'milky', '/Assets/Assets/Milky.avif', false),
  ('milky-melon', 'Melon', 'Melon Milky Pop from Picolé.', 65, 'milky', '/Assets/Assets/Milky.avif', false),
  ('milky-cookie-cream', 'Cookie & Cream', 'Cookie & Cream Milky Pop from Picolé.', 65, 'milky', '/Assets/Assets/Milky.avif', true),
  ('milky-strawberry', 'Strawberry', 'Strawberry Milky Pop from Picolé.', 65, 'milky', '/Assets/Assets/Milky.avif', false);
