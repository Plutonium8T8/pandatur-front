import { Box, Flex, Text, DEFAULT_THEME, Divider } from "@mantine/core";
import { MdCall } from "react-icons/md";
import { HiPhoneMissedCall } from "react-icons/hi";
import { HH_mm } from "@app-constants";
import { parseServerDate, getLanguageByKey } from "@utils";
import { Audio } from "../../../../Audio";
import { findCallParticipantName } from "../../../../utils/callUtils";
import "./Call.css";

const { colors } = DEFAULT_THEME;

/**
 * @param {string} time
 * @param {string} from
 * @param {string} to
 * @param {string} name
 * @param {string} src
 * @param {string} status
 * @param {Array} technicians
 */
export const Call = ({
  time,
  from,
  to,
  name,
  src,
  status,
  technicians = [],
  clients = [],
}) => {
  const isMissed = status === "NOANSWER";

  const callerLabel = findCallParticipantName(from, technicians, clients);
  const receiverLabel = findCallParticipantName(to, technicians, clients);

  // console.log("%c📞 Звонок", "color: green; font-weight: bold");
  // console.log("⏱ Время:", time);
  // console.log("📍 Статус:", status);
  // console.log("➡️ Звонит:", callerLabel);
  // console.log("⬅️ Получает:", receiverLabel);
  // console.log("🎧 Аудио:", src);

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
              <Text style={{ whiteSpace: "nowrap" }} size="sm" c={colors.gray[7]}>
                {getLanguageByKey("callFrom")}:
              </Text>
              <Text size="sm" c="black">
                {callerLabel}
              </Text>
              <Text size="sm" c={colors.gray[7]}>
                {getLanguageByKey("callTo")}: {receiverLabel}
              </Text>
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
