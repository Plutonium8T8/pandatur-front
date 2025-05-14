import { Box, Flex, Text, DEFAULT_THEME, Divider } from "@mantine/core";
import { MdCall } from "react-icons/md";
import { HiPhoneMissedCall } from "react-icons/hi";
import { HH_mm } from "@app-constants";
import { parseServerDate, getLanguageByKey } from "@utils";
import { Audio } from "../../../../Audio";
import "./Call.css";

const { colors } = DEFAULT_THEME;

export const Call = ({ time, from, to, name, src, status }) => {
  const isMissed = status === "NOANSWER";

  const showFrom = name || from;

  return (
    <Box maw="700px" p="xs" mx="auto" className="call-message">
      <Flex w="100%" gap="8" justify="space-between">
        <Flex gap="12" align="center">
          {isMissed ? (
            <HiPhoneMissedCall size={28} color="#c92a2a" />
          ) : (
            <MdCall size={36} />
          )}

          <Divider orientation="vertical" />

          <Box>
            <Flex wrap="wrap" gap={4}>
              {showFrom && (
                <>
                  <Text
                    style={{ whiteSpace: "nowrap" }}
                    size="sm"
                    c={colors.gray[7]}
                  >
                    {getLanguageByKey("callFrom")}:
                  </Text>
                  <Text size="sm" c="black">
                    {name || from}
                  </Text>
                </>
              )}

              {to && (
                <>
                  <Text size="sm" c={colors.gray[7]}>
                    {getLanguageByKey("callTo")}:
                  </Text>
                  <Text size="sm">{to}</Text>
                </>
              )}
            </Flex>
          </Box>

          <Divider orientation="vertical" />

          {isMissed ? (
            <Text size="sm" c="red">
              {getLanguageByKey("noAnswer")}
            </Text>
          ) : (
            <Audio src={src} />
          )}
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
