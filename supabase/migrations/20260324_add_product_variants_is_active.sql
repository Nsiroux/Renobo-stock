alter table public.product_variants
  add column if not exists is_active boolean;

update public.product_variants
set is_active = true
where is_active is null;
