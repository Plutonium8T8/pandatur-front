import { Flex, Text, Image } from "@mantine/core";
import { CiWarning } from "react-icons/ci";
import { FaHeadphones } from "react-icons/fa6";
import { IoMdCheckmark } from "react-icons/io";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import { renderContent } from "../../renderContent";
import { HH_mm, MEDIA_TYPE, DEFAULT_PHOTO } from "../../../../app-constants";
import { parseServerDate, MESSAGES_STATUS, getFullName } from "../../../utils";
import { Call } from "./Call";
import { socialMediaIcons } from "../../../utils";
import { parseCallParticipants } from "../../../utils/callUtils";
import "./Message.css";

const DEFAULT_SENDER_NAME = "Panda Tur";

const MESSAGE_STATUS_ICONS = {
  [MESSAGES_STATUS.PENDING]: <IoMdCheckmark size={16} color="#666" />,      // Одна серая галочка
  [MESSAGES_STATUS.ERROR]: <CiWarning size={16} color="red" />,             // Красный восклицательный знак
  [MESSAGES_STATUS.SUCCESS]: <IoCheckmarkDoneSharp size={16} color="green" />, // Две зеленые галочки
};

export const SendedMessage = ({
  msg,
  technician,
  technicians = [],
  personalInfo = {},
}) => {

  const isCall = msg.mtype === MEDIA_TYPE.CALL;
  const clients = personalInfo.clients || [];

  const findClientByPhone = (phone) =>
    clients.find((c) => String(c?.id?.phone) === String(phone));

  const findTechnicianBySip = (sip) =>
    technicians.find(
      (t) => !String(t.value).startsWith("__group__") && t.sipuni_id === String(sip)
    );

  const findTechnicianById = (id) =>
    technicians.find(
      (t) => !String(t.value).startsWith("__group__") && String(t.value) === String(id)
    );

  const resolvedTechnician = technician || findTechnicianById(msg.sender_id);
  const senderName =
    getFullName(resolvedTechnician?.id?.name, resolvedTechnician?.id?.surname) ||
    resolvedTechnician?.label ||
    DEFAULT_SENDER_NAME;

  // Получаем фото техника
  const getTechnicianPhoto = () => {
    // Если есть фото у техника
    if (resolvedTechnician?.id?.photo && resolvedTechnician.id.photo.trim() !== "") {
      return resolvedTechnician.id.photo;
    }
    
    // Возвращаем null для использования fallback
    return null;
  };

  const technicianPhoto = getTechnicianPhoto();

  if (isCall) {
    const participants = parseCallParticipants(
      msg.call_metadata, 
      technicians, 
      personalInfo.clients || []
    );

    return (
      <Flex w="100%" justify="end">
        <Call
          time={msg.time_sent}
          from={participants.callerId}
          to={participants.receiverId}
          name={participants.callerName}
          src={msg.message}
          status={msg.call_metadata?.status}
          technicians={technicians}
          clients={personalInfo.clients || []}
        />
      </Flex>
    );
  }

  return (
    <Flex w="100%" justify="end">
      <Flex w="90%" direction="column" className="chat-message sent">
        <Flex justify="end" gap="8">
          <Image 
            w={36} 
            h={36} 
            radius="50%" 
            src={technicianPhoto}
            fallbackSrc={DEFAULT_PHOTO} 
          />
          <Flex>
            <Flex miw="250px" direction="column" p="8" className="text" bg="#f0f8f0">
              <Flex align="center" gap={8}>
                <FaHeadphones size={12} />
                <Text fw="bold" size="sm">
                  {senderName}
                </Text>
                {socialMediaIcons[msg.platform] || null}
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
