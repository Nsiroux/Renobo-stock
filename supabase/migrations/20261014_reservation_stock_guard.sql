-- Run in Supabase SQL Editor. Existing reservations are preserved.
begin;

create or replace function public.check_reservation_stock()
returns trigger
language plpgsql
as $$
declare
  v_physical bigint;
  v_reserved bigint;
begin
  if new.status not in ('reserved', 'partial') then
    return new;
  end if;

  if new.quantity is null or new.quantity <= 0 then
    raise exception 'Aantal moet groter zijn dan 0';
  end if;

  -- Reductions and metadata edits must remain possible for existing shortages.
  if tg_op = 'UPDATE' then
    if old.status in ('reserved', 'partial')
       and old.product_variant_id = new.product_variant_id
       and new.quantity <= old.quantity then
      return new;
    end if;
  end if;

  -- Serialize reservations for the same variant before calculating availability.
  perform id from public.product_variants
  where id = new.product_variant_id for update;
  if not found then
    raise exception 'Productvariant niet gevonden';
  end if;

  select coalesce(sum(quantity), 0) into v_physical
  from public.inventory where product_variant_id = new.product_variant_id;

  select coalesce(sum(quantity), 0) into v_reserved
  from public.reservations
  where product_variant_id = new.product_variant_id
    and status in ('reserved', 'partial')
    and id is distinct from new.id;

  if new.quantity > v_physical - v_reserved then
    raise exception 'Onvoldoende beschikbare stock. Beschikbaar: %, gevraagd: %',
      v_physical - v_reserved, new.quantity;
  end if;

  return new;
end;
$$;

drop trigger if exists reservation_stock_guard on public.reservations;
create trigger reservation_stock_guard
before insert or update on public.reservations
for each row execute function public.check_reservation_stock();

commit;
