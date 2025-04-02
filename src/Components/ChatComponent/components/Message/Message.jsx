import {
  FaFacebook,
  FaViber,
  FaInstagram,
  FaWhatsapp,
  FaTelegram
} from "react-icons/fa"
import { Flex, Text, Avatar } from "@mantine/core"
import { renderContent } from "../../utils"
import { HH_mm } from "../../../../app-constants"
import { parseServerDate } from "../../../utils"
import { DEFAULT_PHOTO } from "../../../../app-constants"
import "./Message.css"

const platformIcons = {
  facebook: <FaFacebook />,
  instagram: <FaInstagram />,
  whatsapp: <FaWhatsapp />,
  viber: <FaViber />,
  telegram: <FaTelegram />
}

export const Message = ({ msg, msgIndex, userId, personalInfo }) => {
  const uniqueKey = `${msg.id || msg.ticket_id}-${msg.time_sent}-${msgIndex}`

  const isMessageSentByMe = msg.sender_id === userId || msg.sender_id === 1

  return (
    <Flex w="100%" justify={isMessageSentByMe ? "end" : "start"}>
      <Flex
        w="70%"
        direction="column"
        key={uniqueKey}
        className={`chat-message ${isMessageSentByMe ? "sent" : "received"}`}
      >
        <Flex justify={isMessageSentByMe ? "end" : "start"} gap="8">
          {!isMessageSentByMe && (
            <Avatar src={personalInfo.photo || DEFAULT_PHOTO} />
          )}
          <Flex direction="column" p="8" className="text">
            {msg.sender_id !== 1 && msg.sender_id !== userId && (
              <Flex align="center" gap="4">
                <Text size="sm" fw="bold">
                  {personalInfo.name} {personalInfo.surname}
                </Text>

                {platformIcons[msg.platform] || null}
              </Flex>
            )}
            {renderContent(msg)}

            <Text size="sm" ta="end">
              {parseServerDate(msg.time_sent).format(HH_mm)}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
