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
