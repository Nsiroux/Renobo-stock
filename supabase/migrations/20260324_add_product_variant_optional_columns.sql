alter table public.product_variants
  add column if not exists color_id uuid references public.colors(id),
  add column if not exists thickness_mm integer,
  add column if not exists density_gsm integer,
  add column if not exists variant_code text,
  add column if not exists width_mm integer,
  add column if not exists length_mm integer,
  add column if not exists inventory_mode text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_variants_inventory_mode_check'
  ) then
    alter table public.product_variants
      add constraint product_variants_inventory_mode_check
      check (inventory_mode in ('pads', 'simple'));
  end if;
end
$$;
