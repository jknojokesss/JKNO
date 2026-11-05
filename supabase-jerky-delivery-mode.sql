-- Per-store consignment delivery: drop off (default) or ship to store.
alter table consignment_partners
  add column if not exists delivery_mode text default 'drop_off'
  check (delivery_mode in ('drop_off', 'ship'));

update consignment_partners
set delivery_mode = 'ship'
where id = 'bb35c37e-df9d-47b2-abc2-087c28d45070';
