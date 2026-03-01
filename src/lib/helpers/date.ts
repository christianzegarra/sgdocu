import { format, parse, startOfToday } from "date-fns";

export const FORMAT_DATE = "yyyy-MM-dd";
export const FORMAT_DATETIME = "yyyy-MM-dd HH:mm";
export const DISPLAY_DATE = "dd/MM/yyyy";
export const DISPLAY_DATETIME = "dd/MM/yyyy hh:mm aa";

export const formatCustomDate = (date: string) => {
  return format(parse(date, FORMAT_DATE, new Date()), DISPLAY_DATE);
};

export const formatAuditDate = (date: string) => {
  return format(parse(date, FORMAT_DATETIME, new Date()), DISPLAY_DATETIME);
};

export const parseCustomDate = (date: string, format: string = FORMAT_DATE) => {
  return parse(date, format, new Date());
};

export const futureTenYears = new Date().getFullYear() + 10;

export const disabledFromTomorrow = { after: startOfToday() };

export const formatDecimalHours = (decimalHours: number) => {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${hours}h ${minutes}m`;
};
