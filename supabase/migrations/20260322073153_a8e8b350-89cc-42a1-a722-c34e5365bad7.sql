ALTER TABLE public.restaurant_config ADD COLUMN city text NOT NULL DEFAULT 'Marília - SP';
ALTER TABLE public.restaurant_config ADD COLUMN rating numeric NOT NULL DEFAULT 4.8;
ALTER TABLE public.restaurant_config ADD COLUMN rating_count text NOT NULL DEFAULT '100+';