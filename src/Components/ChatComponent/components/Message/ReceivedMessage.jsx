import { Flex, Text, Avatar, DEFAULT_THEME } from "@mantine/core";
import {
  FaFacebook,
  FaViber,
  FaInstagram,
  FaWhatsapp,
  FaTelegram,
} from "react-icons/fa";
import { DEFAULT_PHOTO, HH_mm } from "../../../../app-constants";
import { getFullName, parseServerDate } from "../../../utils";
import { renderContent } from "../../utils";

const { colors } = DEFAULT_THEME;

const platformIcons = {
  facebook: <FaFacebook />,
  instagram: <FaInstagram />,
  whatsapp: <FaWhatsapp />,
  viber: <FaViber />,
  telegram: <FaTelegram />,
};

export const ReceivedMessage = ({ personalInfo, msg }) => {
  const receivedMsj = personalInfo?.clients?.find(
    ({ id }) => msg.client_id === id,
  );

  return (
    <Flex w="100%">
      <Flex w="90%" direction="column" className="chat-message received">
        <Flex gap="8">
          <Avatar src={personalInfo?.photo_url || DEFAULT_PHOTO} />

          <Flex miw="250px" direction="column" p="8" className="text">
            <Flex c={colors.gray[7]} align="center" gap="4">
              <Text size="sm" fw="bold">
                {getFullName(receivedMsj?.name, receivedMsj?.surname) ||
                  `#${msg.client_id}`}
              </Text>

              {platformIcons[msg.platform] || null}
            </Flex>

            {renderContent(msg)}

            <Text c={colors.gray[7]} size="sm" ta="end">
              {parseServerDate(msg.time_sent).format(HH_mm)}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};
