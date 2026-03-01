import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { CalendarIcon, ChevronDownIcon, MoveHorizontalIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subWeeks, subMonths, startOfYear, endOfYear, subYears } from "date-fns";
import { DISPLAY_DATE } from "@/lib/helpers/date";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { Field } from "../ui/field";

type Props = {
  field: any;
  disabled?: boolean;
  onChange?: (value: { from?: Date; to?: Date } | undefined) => void;
  fastSelectors?: boolean;
  disableFuture?: boolean;
  hasFormControl?: boolean;
  align?: "center" | "end" | "start";
};

export const RangeCalendarSelector = ({ field, disabled = false, onChange, fastSelectors = true, disableFuture = false, hasFormControl = true, align = "center" }: Props) => {
  const [openDate, setOpenDate] = useState(false);
  const [activeSelector, setActiveSelector] = useState<string | null>("monthToDate");
  const isMobile = useIsMobile();

  const from = field?.value?.from ? new Date(field.value.from) : undefined;
  const to = field?.value?.to ? new Date(field.value.to) : undefined;

  const formattedRange =
    from && to ? (
      <span className='flex items-center gap-2'>
        {format(from, DISPLAY_DATE)} <MoveHorizontalIcon /> {format(to, DISPLAY_DATE)}
      </span>
    ) : (
      "Inicio - Fin"
    );

  const handleSelect = (value: { from?: Date; to?: Date } | undefined) => {
    field?.onChange?.(value);
    if (onChange) {
      onChange(value);
    }
    setActiveSelector("custom");
  };

  const setFastRange = (type: "today" | "monthToDate" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "thisYear" | "lastYear") => {
    const now = new Date();
    let range: { from: Date; to: Date } | undefined;

    if (type === "today") {
      range = { from: now, to: now };
    }

    if (type === "monthToDate") {
      range = { from: startOfMonth(now), to: now };
    }
    if (type === "thisWeek") {
      range = { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    }
    if (type === "lastWeek") {
      const lastWeek = subWeeks(now, 1);
      range = { from: startOfWeek(lastWeek, { weekStartsOn: 1 }), to: endOfWeek(lastWeek, { weekStartsOn: 1 }) };
    }
    if (type === "thisMonth") {
      range = { from: startOfMonth(now), to: endOfMonth(now) };
    }
    if (type === "lastMonth") {
      const lastMonth = subMonths(now, 1);
      range = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
    if (type === "thisYear") {
      range = { from: startOfYear(now), to: endOfYear(now) };
    }
    if (type === "lastYear") {
      const lastYear = subYears(now, 1);
      range = { from: startOfYear(lastYear), to: endOfYear(lastYear) };
    }

    if (disableFuture === true && range && range.to > now) {
      range.to = now;
    }

    setActiveSelector(type);
    field.onChange?.(range);
    if (onChange) {
      onChange(range);
    }
    setOpenDate(false);
  };

  const TriggerButton = (
    <Button
      type='button'
      variant='outline'
      className={cn("w-full pl-3 text-left font-normal justify-between", field?.value && "text-muted-foreground", disabled && "cursor-not-allowed opacity-50")}
      disabled={disabled}
    >
      <CalendarIcon className='mr-2 h-4 w-4' />
      {formattedRange}
      <ChevronDownIcon className='ml-auto h-4 w-4 opacity-50' />
    </Button>
  );

  return (
    <Popover open={openDate} onOpenChange={setOpenDate}>
      <PopoverTrigger asChild>{hasFormControl ? <Field>{TriggerButton}</Field> : TriggerButton}</PopoverTrigger>
      <PopoverContent className='w-auto p-0 flex flex-col sm:flex-row' align={align}>
        {fastSelectors && (
          <div className='flex flex-col gap-1 p-2 border-r w-45'>
            <Button variant={activeSelector === "today" ? "default" : "ghost"} size='sm' className='justify-start font-normal' onClick={() => setFastRange("today")}>
              Hoy
            </Button>
            <Separator />
            <Button variant={activeSelector === "monthToDate" ? "default" : "ghost"} size='sm' className='justify-start font-normal' onClick={() => setFastRange("monthToDate")}>
              Este mes hasta hoy
            </Button>
            <Separator />
            <Button variant={activeSelector === "thisWeek" ? "default" : "ghost"} size='sm' className='justify-start font-normal' onClick={() => setFastRange("thisWeek")}>
              Esta semana
            </Button>
            <Button variant={activeSelector === "lastWeek" ? "default" : "ghost"} size='sm' className='justify-start font-normal' onClick={() => setFastRange("lastWeek")}>
              Semana pasada
            </Button>
            <Separator />
            <Button variant={activeSelector === "thisMonth" ? "default" : "ghost"} size='sm' className='justify-start font-normal' onClick={() => setFastRange("thisMonth")}>
              Este mes
            </Button>
            <Button variant={activeSelector === "lastMonth" ? "default" : "ghost"} size='sm' className='justify-start font-normal' onClick={() => setFastRange("lastMonth")}>
              Mes pasado
            </Button>
            <Separator />
            <Button variant={activeSelector === "thisYear" ? "default" : "ghost"} size='sm' className='justify-start font-normal' onClick={() => setFastRange("thisYear")}>
              Este año
            </Button>
            <Button variant={activeSelector === "lastYear" ? "default" : "ghost"} size='sm' className='justify-start font-normal' onClick={() => setFastRange("lastYear")}>
              Año pasado
            </Button>
            {activeSelector === "custom" && (
              <>
                <Separator />
                <Button
                  variant='default'
                  size='sm'
                  className='justify-start font-normal'
                  onClick={() => {}} // No-op or keep as is, but it's already active so clicking does nothing.
                >
                  Personalizado
                </Button>
              </>
            )}
          </div>
        )}
        <div className='p-2'>
          <Calendar
            mode='range'
            disabled={disableFuture === true ? { after: new Date() } : disabled}
            onSelect={handleSelect}
            showOutsideDays={false}
            selected={field?.value}
            numberOfMonths={isMobile ? 1 : 2}
            defaultMonth={new Date(new Date().setMonth(new Date().getMonth() - (isMobile ? 0 : 1)))}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
