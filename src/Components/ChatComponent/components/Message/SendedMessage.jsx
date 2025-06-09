import { Flex, Text } from "@mantine/core";
import { CiWarning } from "react-icons/ci";
import { FaHeadphones } from "react-icons/fa6";
import { IoMdCheckmark } from "react-icons/io";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import { renderContent } from "../../renderContent";
import { HH_mm, MEDIA_TYPE } from "../../../../app-constants";
import { parseServerDate, MESSAGES_STATUS, getFullName } from "../../../utils";
import { Call } from "./Call";
import "./Message.css";

const DEFAULT_SENDER_NAME = "Panda Tur";

const MESSAGE_STATUS_ICONS = {
  [MESSAGES_STATUS.PENDING]: <IoMdCheckmark />,
  [MESSAGES_STATUS.ERROR]: (
    <Flex c="red">
      <CiWarning />
    </Flex>
  ),
  [MESSAGES_STATUS.SUCCESS]: <IoCheckmarkDoneSharp />,
};

export const SendedMessage = ({ msg, technician, technicians = [], personalInfo = {} }) => {
  const isCall = msg.mtype === MEDIA_TYPE.CALL;
  const clients = personalInfo.clients || [];

  const findClientByPhone = (phone) =>
    clients.find((c) => String(c?.id?.phone) === String(phone));
  const findTechnicianBySip = (sip) =>
    technicians.find((t) => String(t.sipuni_id) === String(sip));

  const senderName = technician?.label || DEFAULT_SENDER_NAME;

  if (isCall) {
    const { short_src_num, short_dst_num } = msg.call_metadata || {};

    const callerClient = findClientByPhone(short_src_num);
    const callerTechnician = findTechnicianBySip(short_src_num);

    const receiverClient = findClientByPhone(short_dst_num);
    const receiverTechnician = findTechnicianBySip(short_dst_num);

    const callerLabel =
      getFullName(callerClient?.id?.name, callerClient?.id?.surname) ||
      getFullName(callerTechnician?.id?.name, callerTechnician?.id?.surname) ||
      short_src_num;

    const receiverLabel =
      getFullName(receiverClient?.id?.name, receiverClient?.id?.surname) ||
      getFullName(receiverTechnician?.id?.name, receiverTechnician?.id?.surname) ||
      short_dst_num;

    return (
      <Flex w="100%" justify="end">
        <Call
          time={msg.time_sent}
          from={short_src_num}
          to={short_dst_num}
          name={callerLabel}
          src={msg.message}
          status={msg.call_metadata?.status}
          technicians={technicians}
        />
      </Flex>
    );
  }

  return (
    <Flex w="100%" justify="end">
      <Flex w="90%" direction="column" className="chat-message sent">
        <Flex justify="end" gap="8">
          <Flex>
            <Flex miw="250px" direction="column" p="8" className="text" bg="#eeeeee">
              <Flex align="center" gap={8}>
                <FaHeadphones size={12} />
                <Text fw="bold" size="sm">
                  {senderName}
                </Text>
              </Flex>

              {renderContent(msg)}

              <Flex justify="end" align="center" gap={4}>
                <Flex align="center">
                  {MESSAGE_STATUS_ICONS[msg.messageStatus]}
                </Flex>

                <Text size="sm">
                  {parseServerDate(msg.time_sent).format(HH_mm)}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};
