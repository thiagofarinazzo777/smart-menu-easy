ALTER TABLE public.restaurant_config ADD COLUMN delivery_time text NOT NULL DEFAULT '40-70 min';
ALTER TABLE public.restaurant_config ADD COLUMN min_order numeric NOT NULL DEFAULT 30;