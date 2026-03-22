
CREATE TABLE public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time,
  close_time time,
  is_closed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (day_of_week)
);

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read business_hours" ON public.business_hours FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage business_hours" ON public.business_hours FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default hours (0=Sunday, 1=Monday, ..., 6=Saturday)
-- Default: Mon-Sun 19:00-23:00
INSERT INTO public.business_hours (day_of_week, open_time, close_time, is_closed) VALUES
  (0, '19:00', '23:00', false),
  (1, '19:00', '23:00', false),
  (2, '19:00', '23:00', false),
  (3, '19:00', '23:00', false),
  (4, '19:00', '23:00', false),
  (5, '19:00', '23:00', false),
  (6, '19:00', '23:00', false);
