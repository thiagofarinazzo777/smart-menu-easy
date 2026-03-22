import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export interface BusinessHour {
  id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

export function useBusinessHours() {
  const { data: hours = [], ...rest } = useQuery({
    queryKey: ["business-hours"],
    queryFn: async () => {
      const { data } = await supabase
        .from("business_hours")
        .select("*")
        .order("day_of_week");
      return (data ?? []) as BusinessHour[];
    },
  });

  return { hours, ...rest };
}

export function useIsRestaurantOpen() {
  const { hours, isLoading } = useBusinessHours();
  const [isOpen, setIsOpen] = useState(false);
  const [nextOpenInfo, setNextOpenInfo] = useState("");

  useEffect(() => {
    if (hours.length === 0) return;

    const check = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      const today = hours.find((h) => h.day_of_week === dayOfWeek);

      if (today && !today.is_closed && today.open_time && today.close_time) {
        if (currentTime >= today.open_time && currentTime < today.close_time) {
          setIsOpen(true);
          setNextOpenInfo("");
          return;
        }
      }

      setIsOpen(false);

      // Find next open day/time
      if (today && !today.is_closed && today.open_time && currentTime < today.open_time) {
        setNextOpenInfo(`Abre hoje às ${today.open_time.slice(0, 5)}`);
        return;
      }

      for (let i = 1; i <= 7; i++) {
        const nextDay = (dayOfWeek + i) % 7;
        const h = hours.find((x) => x.day_of_week === nextDay);
        if (h && !h.is_closed && h.open_time) {
          if (i === 1) {
            setNextOpenInfo(`Abre amanhã às ${h.open_time.slice(0, 5)}`);
          } else {
            setNextOpenInfo(`Abre ${DAY_NAMES[nextDay]} às ${h.open_time.slice(0, 5)}`);
          }
          return;
        }
      }
      setNextOpenInfo("Fechado");
    };

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [hours]);

  return { isOpen, nextOpenInfo, isLoading, hours };
}

export { DAY_NAMES };
