import { Flex, Text, Image, DEFAULT_THEME } from "@mantine/core";
import { DEFAULT_PHOTO, HH_mm, MEDIA_TYPE } from "../../../../app-constants";
import { getFullName, parseServerDate, socialMediaIcons } from "../../../utils";
import { renderContent } from "../../renderContent";
import { Call } from "./Call";

const { colors } = DEFAULT_THEME;

export const ReceivedMessage = ({ personalInfo, msg }) => {
  const sender = personalInfo?.clients?.find(
    ({ id }) => id === msg.sender_id,
  );

  const senderName =
    getFullName(sender?.name, sender?.surname) ||
    sender?.phone || `#${msg.sender_id}`;


  return (
    <Flex w="100%">
      {msg.mtype === MEDIA_TYPE.CALL ? (
        <Call
          time={msg.time_sent}
          from={msg.call_metadata?.src_num}
          to={msg.treename || msg.treenumber || msg.call_metadata?.dst_num}
          name={senderName}
          src={msg.message}
          status={msg.call_metadata?.status}
        />
      ) : (
        <Flex w="90%" direction="column" className="chat-message received">
          <Flex gap="8">
            <Image
              w={36}
              h={36}
              radius="50%"
              fallbackSrc={DEFAULT_PHOTO}
            />

            <Flex miw="250px" direction="column" p="8" className="text">
              <Flex c={colors.gray[7]} align="center" gap="4">
                <Text size="sm" fw="bold">
                  {senderName}
                </Text>

                {socialMediaIcons[msg.platform] || null}
              </Flex>

              {renderContent(msg)}

              <Text c={colors.gray[7]} size="sm" ta="end">
                {parseServerDate(msg.time_sent).format(HH_mm)}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};
