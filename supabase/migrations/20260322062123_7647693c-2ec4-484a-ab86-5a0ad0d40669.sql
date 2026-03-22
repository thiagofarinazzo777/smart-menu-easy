
CREATE TABLE public.delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  neighborhood TEXT NOT NULL,
  fee NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read delivery_zones" ON public.delivery_zones FOR SELECT USING (true);
CREATE POLICY "Admins manage delivery_zones" ON public.delivery_zones FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
