ALTER TABLE public.restaurant_config
  ADD COLUMN zone1_fee numeric NOT NULL DEFAULT 5,
  ADD COLUMN zone2_fee numeric NOT NULL DEFAULT 8,
  ADD COLUMN zone3_fee numeric NOT NULL DEFAULT 12;