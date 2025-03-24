import { Flex, Text } from "@mantine/core"
import dayjs from "dayjs"
import { cleanValue } from "./utils"
import { DD_MM_YYYY, FORMAT_TIME, DATE_TIME_FORMAT } from "../app-constants"

const formattedDate = (date) => {
  const parsedDate = dayjs(date, DATE_TIME_FORMAT)

  return {
    formateDate: parsedDate.format(DD_MM_YYYY),
    formateTime: parsedDate.format(FORMAT_TIME)
  }
}

export const DateCell = ({ date }) => {
  const { formateDate, formateTime } = formattedDate(date)

  return (
    <>
      {date ? (
        <Flex direction="column">
          <Text>{formateDate}</Text>
          <Text>{formateTime}</Text>
        </Flex>
      ) : (
        cleanValue(date)
      )}
    </>
  )
}
