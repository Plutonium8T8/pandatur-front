import dayjs from "dayjs"
import { DATE_TIME_FORMAT } from "../../app-constants"

export const formatDate = (date) => {
  return date ? dayjs(date).format(DATE_TIME_FORMAT) : null
}

export const parseServerDate = (date) => {
  if (date === "Invalid Date") {
    return null
  }
  return date ? dayjs(date, DATE_TIME_FORMAT) : null
}
