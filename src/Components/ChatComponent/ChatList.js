import React, { useState, useEffect, useRef, useMemo } from "react"
import { FixedSizeList } from "react-window"
import { translations } from "../utils/translations"
import { useUser, useApp } from "../../hooks"
import { useDOMElementHeight } from "../../hooks"
import { ChatListItem } from "./components"

const language = localStorage.getItem("language") || "RO"

const ChatList = ({ setIsLoading, selectTicketId, setSelectTicketId }) => {
  const { tickets, getClientMessagesSingle } = useApp()
  const { userId } = useUser()
  const [showMyTickets, setShowMyTickets] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const chatListRef = useRef(null)
  const wrapperChatItemRef = useRef(null)
  const wrapperChatHeight = useDOMElementHeight(wrapperChatItemRef)

  useEffect(() => {
    if (chatListRef.current && selectTicketId) {
      const container = chatListRef.current
      const selectedElement = container.querySelector(
        `[data-ticket-id="${selectTicketId}"]`
      )

      if (selectedElement) {
        const containerHeight = container.clientHeight
        const itemTop = selectedElement.offsetTop
        const itemHeight = selectedElement.clientHeight
        const scrollTop = itemTop - containerHeight / 2 + itemHeight / 2

        container.scrollTo({
          top: scrollTop
        })
      }
    }
  }, [selectTicketId, tickets])

  useEffect(() => {
    if (!selectTicketId) return

    setIsLoading(true)

    getClientMessagesSingle(selectTicketId).finally(() => {
      setIsLoading(false)
    })
  }, [selectTicketId])

  const handleFilterInput = (e) => {
    setSearchQuery(e.target.value.toLowerCase())
  }

  const handleTicketClick = (ticketId) => {
    console.log("🖱 Клик по тикету в списке:", ticketId)

    if (selectTicketId === ticketId) return

    setSelectTicketId(ticketId)
  }

  const sortedTickets = useMemo(() => {
    let filtered = [...tickets]

    const parseCustomDate = (dateStr) => {
      if (!dateStr) return 0

      const [datePart, timePart] = dateStr.split(" ")
      if (!datePart || !timePart) return 0

      const [day, month, year] = datePart.split("-").map(Number)
      const [hours, minutes, seconds] = timePart.split(":").map(Number)

      return new Date(year, month - 1, day, hours, minutes, seconds).getTime()
    }

    const getLastMessageTime = (ticket) => parseCustomDate(ticket.time_sent)

    filtered.sort((a, b) => getLastMessageTime(b) - getLastMessageTime(a))

    if (showMyTickets) {
      filtered = filtered.filter((ticket) => ticket.technician_id === userId)
    }

    if (searchQuery.trim()) {
      const lowerSearchQuery = searchQuery.toLowerCase()
      filtered = filtered.filter((ticket) => {
        const ticketId = ticket.id.toString().toLowerCase()
        const ticketContact = ticket.contact ? ticket.contact.toLowerCase() : ""
        const tags = ticket.tags
          ? ticket.tags
              .replace(/[{}]/g, "")
              .split(",")
              .map((tag) => tag.trim().toLowerCase())
          : []

        return (
          ticketId.includes(lowerSearchQuery) ||
          ticketContact.includes(lowerSearchQuery) ||
          tags.some((tag) => tag.includes(lowerSearchQuery))
        )
      })
    }

    return filtered
  }, [tickets, showMyTickets, searchQuery])

  const ChatItem = ({ index, style }) => {
    const ticket = sortedTickets[index]

    return (
      <ChatListItem
        chat={ticket}
        style={style}
        onHandleTicketClick={handleTicketClick}
        selectTicketId={selectTicketId}
      />
    )
  }

  return (
    <div className="users-container" ref={chatListRef}>
      <div className="header-list-chat">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="extra-info-title">
            {translations["Chat"][language]}
          </div>
          <label className="label-check">
            {translations["Leadurile mele"][language]}
            <input
              type="checkbox"
              id="myTicketsCheckbox"
              onChange={(e) => setShowMyTickets(e.target.checked)}
              checked={showMyTickets}
            />
          </label>
        </div>

        <div className="filter-container-chat">
          <input
            type="text"
            placeholder={"Cauta dupa Lead, Client sau Tag"}
            onInput={handleFilterInput}
            className="ticket-filter-input"
          />
        </div>
      </div>

      <div className="chat-item-container" ref={wrapperChatItemRef}>
        <FixedSizeList
          height={wrapperChatHeight}
          itemCount={sortedTickets.length || 0}
          itemSize={110}
          width="100%"
        >
          {ChatItem}
        </FixedSizeList>
      </div>
    </div>
  )
}

export default ChatList
