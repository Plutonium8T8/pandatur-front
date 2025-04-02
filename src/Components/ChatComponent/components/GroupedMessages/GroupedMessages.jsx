import { Flex, Badge, DEFAULT_THEME } from "@mantine/core"
import { useUser, useApp } from "../../../../hooks"
import { getLanguageByKey } from "../../../utils"
import { Message } from "../Message"
import "./GroupedMessages.css"

const { colors } = DEFAULT_THEME

const parseDate = (dateString) => {
  if (!dateString) return null
  const [date, time] = dateString.split(" ")
  if (!date || !time) return null
  const [day, month, year] = date.split("-")
  return new Date(`${year}-${month}-${day}T${time}`)
}

export const GroupedMessages = ({ personalInfo, selectTicketId }) => {
  const { userId } = useUser()
  const { messages } = useApp()

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

            <Flex justify="center">
              <Badge c="black" size="lg" bg={colors.gray[3]}>
                {getLanguageByKey("Mesajele clientului")} #{clientId} -{" "}
                {clientName}
              </Badge>
            </Flex>
            <Flex direction="column" gap="xs">
              {messages.map((msg, msgIndex) => (
                <Message
                  msg={msg}
                  msgIndex={msgIndex}
                  userId={userId}
                  personalInfo={personalInfo[clientId]}
                />
              ))}
            </Flex>
          </Flex>
        )
      })}
    </>
  )
}
