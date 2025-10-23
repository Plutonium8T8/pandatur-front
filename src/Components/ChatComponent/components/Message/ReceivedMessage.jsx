import { memo } from "react";
import { Flex, Text, Image, Box } from "@mantine/core";
import { DEFAULT_PHOTO, HH_mm, MEDIA_TYPE } from "../../../../app-constants";
import {
  getFullName,
  parseServerDate,
  socialMediaIcons,
} from "../../../utils";
import { renderContent } from "../../renderContent";
import { Call } from "./Call";
import { parseCallParticipants } from "../../../utils/callUtils";

const ReceivedMessageComponent = ({ personalInfo, msg, technicians = [] }) => {
  const clients = personalInfo?.clients || [];
  const isCall = msg.mtype === MEDIA_TYPE.CALL;

  const findClientByPhone = (phone) =>
    clients.find((c) => String(c.phone) === String(phone));

  const findTechnicianBySip = (sip) =>
    technicians.find((t) => String(t.sipuni_id) === String(sip));

  if (isCall) {
    const participants = parseCallParticipants(
      msg.call_metadata, 
      technicians, 
      clients
    );

    return (
      <Flex w="100%">
        <Call
          time={msg.time_sent}
          from={participants.callerId}
          to={participants.receiverId}
          name={participants.callerName}
          src={msg.message}
          status={msg.call_metadata?.status}
          technicians={technicians}
          clients={clients}
        />
      </Flex>
    );
  }

  const senderClient = clients.find(
    (c) => String(c.id) === String(msg.sender_id)
  );

  const senderTechnician = technicians.find(
    (t) => String(t.id) === String(msg.sender_id)
  );

  const senderName =
    getFullName(senderClient?.name, senderClient?.surname) ||
    senderTechnician?.label ||
    `#${msg.sender_id}`;

  // Получаем фото клиента - сначала из клиента, потом из тикета
  const getClientPhoto = () => {
    // Если есть фото у клиента
    if (senderClient?.photo && senderClient.photo.trim() !== "") {
      return senderClient.photo;
    }
    
    // Если есть фото в тикете
    if (personalInfo?.photo_url && personalInfo.photo_url.trim() !== "") {
      return personalInfo.photo_url;
    }
    
    // Возвращаем null для использования fallback
    return null;
  };

  const clientPhoto = getClientPhoto();

  return (
    <Flex w="100%">
      <Flex w="90%" direction="column" className="chat-message received">
        <Flex gap="8">
          <Image 
            w={36} 
            h={36} 
            radius="50%" 
            src={clientPhoto}
            fallbackSrc={DEFAULT_PHOTO} 
          />
          <Flex
            miw="250px"
            direction="column"
            p="8"
            className="text"
            style={{ backgroundColor: "var(--crm-ui-kit-palette-message-received-background)" }}
          >
            <Flex align="center" gap="4" style={{ color: "var(--crm-ui-kit-palette-text-secondary-dark)" }}>
              <Text size="sm" fw="bold">
                {senderName}
              </Text>
              {socialMediaIcons[msg.platform] || null}
            </Flex>
            <Box mt="xs">
              {renderContent(msg)}
            </Box>
            <Text size="sm" ta="end" style={{ color: "var(--crm-ui-kit-palette-text-secondary-dark)" }}>
              {parseServerDate(msg.time_sent).format(HH_mm)}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

// Мемоизируем компонент для предотвращения лишних ре-рендеров
export const ReceivedMessage = memo(ReceivedMessageComponent, (prevProps, nextProps) => {
  // Сравниваем только те поля, которые действительно влияют на отображение
  return (
    prevProps.msg.id === nextProps.msg.id &&
    prevProps.msg.message === nextProps.msg.message &&
    prevProps.msg.time_sent === nextProps.msg.time_sent &&
    prevProps.msg.sender_id === nextProps.msg.sender_id
  );
});
