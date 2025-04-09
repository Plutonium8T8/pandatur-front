import { Flex, Text } from "@mantine/core";
import dayjs from "dayjs";
import { cleanValue } from "./utils";
import { DD_MM_YYYY, HH_mm, DD_MM_YYYY__HH_mm_ss } from "../app-constants";

const formattedDate = (date) => {
  const parsedDate = dayjs(date, DD_MM_YYYY__HH_mm_ss);

  return {
    formateDate: parsedDate.format(DD_MM_YYYY),
    formateTime: parsedDate.format(HH_mm),
  };
};

export const DateCell = ({ date, gap, direction = "column", ...props }) => {
  const { formateDate, formateTime } = formattedDate(date);

  return (
    <>
      {date ? (
        <Flex direction={direction} gap={gap} {...props}>
          <Text>{formateDate}</Text>
          <Text>{formateTime}</Text>
        </Flex>
      ) : (
        cleanValue(date)
      )}
    </>
  );
};
