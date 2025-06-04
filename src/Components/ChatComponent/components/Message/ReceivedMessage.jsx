import { Flex, Text, Image, DEFAULT_THEME } from "@mantine/core";
import { DEFAULT_PHOTO, HH_mm, MEDIA_TYPE } from "../../../../app-constants";
import {
  getFullName,
  parseServerDate,
  socialMediaIcons,
  extractNumbers,
} from "../../../utils";
import { renderContent } from "../../renderContent";
import { Call } from "./Call";

const { colors } = DEFAULT_THEME;

export const ReceivedMessage = ({ personalInfo, msg, technicians = [] }) => {
  const clients = personalInfo?.clients || [];
  const isCall = msg.mtype === MEDIA_TYPE.CALL;

  if (isCall) {
    const { src_num, short_dst_num } = msg.call_metadata || {};

    const findClientNameByPhone = (phone) =>
      clients.find((c) => String(c?.id?.phone) === String(phone));
    const findTechnicianBySip = (sip) =>
      technicians.find((t) => String(t.sipuni_id) === String(sip));

    const callerClient = findClientNameByPhone(src_num);
    const callerTechnician = findTechnicianBySip(src_num);

    const receiverClient = findClientNameByPhone(short_dst_num);
    const receiverTechnician = findTechnicianBySip(short_dst_num);

    const callerLabel =
      getFullName(callerClient?.id?.name, callerClient?.id?.surname) ||
      callerTechnician?.label ||
      src_num;

    const receiverLabel =
      getFullName(receiverClient?.id?.name, receiverClient?.id?.surname) ||
      receiverTechnician?.label ||
      short_dst_num;

    return (
      <Flex w="100%">
        <Call
          time={msg.time_sent}
          from={src_num}
          to={short_dst_num}
          name={receiverLabel}
          src={msg.message}
          status={msg.call_metadata?.status}
          technicians={technicians}
        />
      </Flex>
    );
  }

  const sender = clients.find(({ id }) => id === msg.sender_id);

  const senderName =
    getFullName(sender?.id?.name, sender?.id?.surname) ||
    sender?.id?.phone ||
    `#${msg.sender_id}`;

  return (
    <Flex w="100%">
      <Flex w="90%" direction="column" className="chat-message received">
        <Flex gap="8">
          <Image w={36} h={36} radius="50%" fallbackSrc={DEFAULT_PHOTO} />

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
    </Flex>
  );
};
