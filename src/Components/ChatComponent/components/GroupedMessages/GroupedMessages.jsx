import { Flex, Badge, DEFAULT_THEME } from "@mantine/core"
import {
  FaFacebook,
  FaViber,
  FaInstagram,
  FaWhatsapp,
  FaTelegram
} from "react-icons/fa"
import { useRef, useState } from "react"
import { useUser, useApp } from "../../../../hooks"
import { getLanguageByKey } from "../../../utils"
import { renderContent } from "../../utils"
import "./GroupedMessages.css"

const { colors } = DEFAULT_THEME

const platformIcons = {
  facebook: <FaFacebook />,
  instagram: <FaInstagram />,
  whatsapp: <FaWhatsapp />,
  viber: <FaViber />,
  telegram: <FaTelegram />
}

const parseDate = (dateString) => {
  if (!dateString) return null
  const [date, time] = dateString.split(" ")
  if (!date || !time) return null
  const [day, month, year] = date.split("-")
  return new Date(`${year}-${month}-${day}T${time}`)
}

export const GroupedMessages = ({ personalInfo, selectTicketId }) => {
  const reactionContainerRef = useRef(null)
  const { userId } = useUser()
  const { messages } = useApp()
  const [selectedReaction, setSelectedReaction] = useState({})
  const [selectedMessageId, setSelectedMessageId] = useState(null)

  const sortedMessages = messages
    .filter((msg) => msg.ticket_id === selectTicketId)
    .sort((a, b) => parseDate(a.time_sent) - parseDate(b.time_sent))

  const groupedMessages = []
  let lastClientId = null

  sortedMessages.forEach((msg) => {
    const messageDate =
      parseDate(msg.time_sent)?.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric"
      }) || "—"

    const currentClientId = Array.isArray(msg.client_id)
      ? msg.client_id[0].toString()
      : msg.client_id.toString()

    let lastGroup =
      groupedMessages.length > 0
        ? groupedMessages[groupedMessages.length - 1]
        : null

    if (
      !lastGroup ||
      lastGroup.date !== messageDate ||
      lastClientId !== currentClientId
    ) {
      lastClientId = currentClientId
      groupedMessages.push({
        date: messageDate,
        clientId: currentClientId,
        messages: [msg]
      })
    } else {
      lastGroup.messages.push(msg)
    }
  })

  const handleReactionClick = (reaction, messageId) => {
    setSelectedReaction((prev) => ({ ...prev, [messageId]: reaction }))
  }

  const getLastReaction = (message) => {
    if (!message.reactions || message.reactions === "{}") {
      return "☺"
    }

    try {
      const reactionsObject = JSON.parse(message.reactions)

      const reactionsArray = Object.values(reactionsObject)

      return reactionsArray.length > 0
        ? reactionsArray[reactionsArray.length - 1]
        : "☺"
    } catch (error) {
      console.error("Ошибка при обработке реакций:", error)
      return "☺"
    }
  }

  return (
    <>
      {groupedMessages.map(({ date, clientId, messages }, index) => {
        const clientInfo = personalInfo[clientId] || {}
        const clientName = clientInfo.name
          ? `${clientInfo.name} ${clientInfo.surname || ""}`
          : `ID: ${clientId}`

        return (
          <Flex direction="column" gap="md" key={index}>
            <Flex justify="center">
              <Badge c="black" size="lg" bg={colors.gray[3]}>
                {date}
              </Badge>
            </Flex>

            <div>
              <Flex justify="center">
                <Badge c="black" size="lg" bg={colors.gray[3]}>
                  {getLanguageByKey("Mesajele clientului")} #{clientId} -{" "}
                  {clientName}
                </Badge>
              </Flex>

              {messages.map((msg, msgIndex) => {
                const uniqueKey = `${msg.id || msg.ticket_id}-${msg.time_sent}-${msgIndex}`

                const lastReaction = getLastReaction(msg)

                return (
                  <div
                    key={uniqueKey}
                    className={`message ${msg.sender_id === userId || msg.sender_id === 1 ? "sent" : "received"}`}
                  >
                    <div className="message-content">
                      <div className="message-row">
                        <div
                          style={{
                            fontSize: "30px",
                            marginRight: "8px"
                          }}
                        >
                          {platformIcons[msg.platform] || null}
                        </div>

                        <div className="text">
                          {renderContent(msg)}
                          <div className="message-time">
                            {msg.sender_id !== 1 &&
                              msg.sender_id !== userId &&
                              (() => {
                                const cleanClientId = String(
                                  msg.client_id
                                ).replace(/[{}]/g, "")
                                const clientInfo = personalInfo[cleanClientId]

                                return (
                                  <span className="client-name">
                                    {clientInfo
                                      ? `${clientInfo.name} ${clientInfo.surname || ""}`
                                      : "Неизвестный"}
                                  </span>
                                )
                              })()}
                            <div
                              className="reaction-toggle-button"
                              onClick={() =>
                                setSelectedMessageId(
                                  selectedMessageId === msg.id ? null : msg.id
                                )
                              }
                            >
                              {lastReaction || "☺"}
                            </div>
                            <div className="time-messages">
                              {parseDate(msg.time_sent)?.toLocaleTimeString(
                                "ru-RU",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                }
                              ) || "—"}
                            </div>
                          </div>
                          {selectedMessageId === msg.id && (
                            <div ref={reactionContainerRef}>
                              <div className="reaction-buttons">
                                {["☺", "👍", "❤️", "😂", "😮", "😢", "😡"].map(
                                  (reaction) => (
                                    <div
                                      style={{ border: "1px solid red" }}
                                      key={reaction}
                                      onClick={() =>
                                        handleReactionClick(reaction, msg.id)
                                      }
                                      className={
                                        selectedReaction[msg.id] === reaction
                                          ? "active"
                                          : ""
                                      }
                                    >
                                      {reaction}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Flex>
        )
      })}
    </>
  )
}
