import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { FaArrowLeft, FaArrowRight } from "react-icons/fa"
import { Flex, ActionIcon, Box } from "@mantine/core"
import { useApp, useUser } from "../../hooks"
import ChatExtraInfo from "./ChatExtraInfo"
import ChatList from "./ChatList"
import { ChatMessages } from "./components"
import "./chat.css"

const ChatComponent = () => {
  const {
    tickets,
    updateTicket,
    setTickets,
    messages,
    markMessagesAsRead,
    getClientMessagesSingle
  } = useApp()
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const { userId } = useUser()
  const [selectTicketId, setSelectTicketId] = useState(
    ticketId ? Number(ticketId) : null
  )
  const [personalInfo, setPersonalInfo] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState("")
  const [isChatListVisible, setIsChatListVisible] = useState(true)

  const updatedTicket =
    tickets.find((ticket) => ticket.id === selectTicketId) || null

  useEffect(() => {
    if (!selectTicketId || !messages.length) return

    const unreadMessages = messages.filter(
      (msg) =>
        msg.ticket_id === selectTicketId &&
        msg.seen_by === "{}" &&
        msg.sender_id !== userId
    )

    if (unreadMessages.length > 0) {
      console.log(
        `🔵 ${unreadMessages.length} непрочитанных сообщений в тикете #${selectTicketId}, помечаем как прочитанные`
      )
      markMessagesAsRead(selectTicketId)
    }
  }, [selectTicketId, messages, userId])

  const handleSelectTicket = (ticketId) => {
    console.log("🎯 Клик по тикету:", ticketId)
    if (selectTicketId !== ticketId) {
      setSelectTicketId(ticketId)
      navigate(`/chat/${ticketId}`)
    }
  }

  useEffect(() => {
    const newPersonalInfo = {}

    tickets.forEach((ticket) => {
      if (ticket.clients && Array.isArray(ticket.clients)) {
        ticket.clients.forEach((client) => {
          newPersonalInfo[client.id] = {
            ...client,
            photo: ticket?.photo_url
          }
        })
      }
    })

    setPersonalInfo(newPersonalInfo)
  }, [tickets])

  useEffect(() => {
    if (!selectTicketId) return

    setIsLoading(true)

    getClientMessagesSingle(selectTicketId).finally(() => {
      setIsLoading(false)
    })
  }, [selectTicketId])

  useEffect(() => {
    if (ticketId && Number(ticketId) !== selectTicketId) {
      setSelectTicketId(Number(ticketId))
    }
  }, [ticketId])

  return (
    <Flex h="100%" className="chat-wrapper">
      <Flex
        w="100%"
        h="100%"
        className={`chat-container ${isChatListVisible ? "" : "chat-hidden"}`}
      >
        {isChatListVisible && (
          <ChatList
            selectTicketId={selectTicketId}
            setSelectTicketId={handleSelectTicket}
          />
        )}

        <Flex pos="relative" w="50%">
          <Box pos="absolute" left="10px" top="10px" style={{ zIndex: 999 }}>
            <ActionIcon
              variant="default"
              onClick={() => setIsChatListVisible((prev) => !prev)}
            >
              {isChatListVisible ? (
                <FaArrowLeft size="12" />
              ) : (
                <FaArrowRight size="12" />
              )}
            </ActionIcon>
          </Box>
          <ChatMessages
            selectTicketId={selectTicketId}
            setSelectedClient={setSelectedClient}
            selectedClient={selectedClient}
            isLoading={isLoading}
            personalInfo={personalInfo}
          />
        </Flex>

        {true && (
          <ChatExtraInfo
            selectedClient={selectedClient}
            ticketId={ticketId}
            selectTicketId={selectTicketId}
            setSelectTicketId={handleSelectTicket}
            tickets={tickets}
            updatedTicket={updatedTicket}
            updateTicket={updateTicket}
            setTickets={setTickets}
            personalInfo={personalInfo}
            setPersonalInfo={setPersonalInfo}
            messages={messages}
            isLoading={isLoading}
          />
        )}
      </Flex>
    </Flex>
  )
}

export default ChatComponent
