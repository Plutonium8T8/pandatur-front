import dayjs from "dayjs"
import { DD_MM_YYYY__HH_mm_ss } from "../../app-constants"

export const formatDate = (date) => {
  return date ? dayjs(date).format(DD_MM_YYYY__HH_mm_ss) : null
}

export const parseServerDate = (date) => {
  if (date === "Invalid Date") {
    return null
  }
  return date ? dayjs(date, DD_MM_YYYY__HH_mm_ss) : null
}

export const formatDateOrUndefined = (date) => {
  const minDate = date?.[0]
  const maxDate = date?.[1]

  return minDate && maxDate
    ? [
        minDate ? dayjs(date?.[0]).format(DD_MM_YYYY__HH_mm_ss) : minDate,
        maxDate ? dayjs(date?.[1]).format(DD_MM_YYYY__HH_mm_ss) : maxDate
      ]
    : undefined
}
