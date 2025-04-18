import { Box, Flex, Text, DEFAULT_THEME, Divider } from "@mantine/core";
import { MdCall } from "react-icons/md";
import { HH_mm } from "../../../../../app-constants";
import { parseServerDate, getLanguageByKey } from "../../../../utils";
import { Audio } from "../../../../Audio";
import "./Call.css";

const { colors } = DEFAULT_THEME;

export const Call = ({ time, from, to, name, src }) => {
  const isFromTo = from && to;

  return (
    <Box p="xs" mx="auto" className="call-message">
      <Flex w="100%" gap="8" justify="space-between">
        <Flex gap="12" align="center">
          <MdCall size="36" />

          <Divider orientation="vertical" />

          {isFromTo && (
            <Box>
              <Flex gap="4">
                <Text size="sm" c={colors.gray[7]}>
                  {getLanguageByKey("callFrom")}:
                </Text>
                <Text size="sm" c="black">
                  {from}
                </Text>
                <Text size="sm" c={colors.gray[7]}>
                  {getLanguageByKey("callTo")}:
                </Text>

                <Text size="sm">{to}</Text>
              </Flex>

              <Text size="sm">{name}</Text>
            </Box>
          )}

          {isFromTo && <Divider orientation="vertical" />}

          <Audio src={src} />
        </Flex>

        <Flex align="end">
          <Text c={colors.gray[7]} size="sm" ta="end">
            {parseServerDate(time).format(HH_mm)}
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
};
