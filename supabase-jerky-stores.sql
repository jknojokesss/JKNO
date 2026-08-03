-- ============================================================
--  JERKY MUNCH — load Efraim's REAL stores (replaces demo set)
--  Run once in the jerky-munch SQL editor ("Run without RLS").
--  Adds region + type to the store model, clears the demo stores,
--  and inserts all 29 real accounts (20 consignment, 9 invoice).
-- ============================================================

-- 1. extend the store model
alter table consignment_partners add column if not exists region text;
alter table consignment_partners add column if not exists type text default 'consignment';

-- 2. clear the demo stores + their activity logs
delete from consignment_log;
delete from consignment_partners;

-- 3. load the real stores (balances start at 0; region + type set)
insert into consignment_partners (store, region, type) values
  -- Lakewood — consignment
  ('Chick Chock',                          'Lakewood',      'consignment'),
  ('The Vineyard North',                   'Lakewood',      'consignment'),
  ('The Vineyard South (Seagull Square)',  'Lakewood',      'consignment'),
  ('Gourmet Glatt Jackson',                'Lakewood',      'consignment'),
  ('Aisle 9 Madison',                      'Lakewood',      'consignment'),
  ('Aisle 9 Jackson',                      'Lakewood',      'consignment'),
  ('Evergreen',                            'Lakewood',      'consignment'),
  ('Super Stop',                           'Lakewood',      'consignment'),
  ('Nutmeg Supermarket',                   'Lakewood',      'consignment'),
  ('Seasons Lakewood',                     'Lakewood',      'consignment'),
  ('Seasons Toms River',                   'Lakewood',      'consignment'),
  ('Cookie Corner',                        'Lakewood',      'consignment'),
  -- Lakewood — invoice
  ('Exxon Madison',                        'Lakewood',      'invoice'),
  ('Kosher Village',                       'Lakewood',      'invoice'),
  ('Kosher West',                          'Lakewood',      'invoice'),
  ('Frieds Gourmet',                       'Lakewood',      'invoice'),
  ('Lechem Bakery',                        'Lakewood',      'invoice'),
  ('Zip K',                                'Lakewood',      'invoice'),
  ('Manko',                                'Lakewood',      'invoice'),
  -- Monsey
  ('Evergreen Rt 59',                      'Monsey',        'consignment'),
  ('Evergreen Pomona',                     'Monsey',        'consignment'),
  ('Seasons Express',                      'Monsey',        'invoice'),
  -- The Catskills
  ('Gourmet Glatt Kiamesha',               'The Catskills', 'consignment'),
  ('Mountain Food',                        'The Catskills', 'consignment'),
  ('Landau''s (Boosur)',                   'The Catskills', 'consignment'),
  ('Buyrite Supermarket',                  'The Catskills', 'consignment'),
  ('Lemonade',                             'The Catskills', 'consignment'),
  -- Deal
  ('Khaskys',                              'Deal',          'consignment'),
  -- Bergenfield
  ('Grand and Essex',                      'Bergenfield',   'invoice');

-- ============================================================
--  29 stores loaded: 20 consignment + 9 invoice, across 5 regions.
--  Consignment ones drive the reconcile/shelf-count flow;
--  invoice ones are flagged for the (to-be-built) invoice flow.
-- ============================================================
