import dayjs from "dayjs";
import { DD_MM_YYYY__HH_mm_ss } from "../../app-constants";

export const formatDate = (date) => {
  return date ? dayjs(date).format(DD_MM_YYYY__HH_mm_ss) : null;
};

export const parseServerDate = (date) => {
  if (date === "Invalid Date") {
    return null;
  }
  return date ? dayjs(date, DD_MM_YYYY__HH_mm_ss) : null;
};

export const parseDate = (dateString) => {
  if (!dateString) return null;
  const [date, time] = dateString.split(" ");
  if (!date || !time) return null;
  const [day, month, year] = date.split("-");
  return new Date(`${year}-${month}-${day}T${time}`);
};

export const parseDateTask = (dateString) => {
  if (!dateString) return null;
  const regex = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
  const match = dateString.match(regex);
  if (!match) return null;
  const [, day, month, year, hours, minutes, seconds] = match;
  return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);
};

export const formatDateTask = (date) => {
  if (!(date instanceof Date) || isNaN(date)) return "";
  return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")
    }-${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")
    }:${date.getMinutes().toString().padStart(2, "0")}:${date
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
};
