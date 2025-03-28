import React, { useState } from "react"
import { Link } from "react-router-dom"
import { truncateText, parseTags } from "../../stringUtils"
import { getPriorityColor } from "../utils/ticketUtils"
import "./TicketCardComponent.css"
import { Modal } from "../Modal"
import SingleChat from "../ChatComponent/SingleChat"
import { Tag } from "../Tag"
import { DEFAULT_PHOTO } from "../../app-constants"

const TicketCard = ({ ticket, onEditTicket }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const tags = parseTags(ticket.tags)

  const formattedPhone =
    ticket.phone &&
    ticket.phone.trim() !== "" &&
    ticket.phone.replace(/[{}]/g, "").trim().toLowerCase() !== "null"
      ? ticket.phone.replace(/[{}]/g, "").trim()
      : "Unknown number"

  return (
    <div
      className="ticket-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <div className="ticket-actions">
          <button
            className="action-button-ticket"
            onClick={() => onEditTicket(ticket)}
          >
            Edit
          </button>
          {/* <button
            className="action-button-ticket"
            onClick={() => setIsChatOpen(true)}
          >
            Open
          </button> */}
        </div>
      )}

      <Link to={`/leads/${ticket.id}`} className="ticket-link">
        <div className="ticket">
          <div className="tickets-descriptions">
            <div
              className="ticket-ribbon"
              style={{ backgroundColor: getPriorityColor(ticket.priority) }}
            ></div>
            <div className="ticket-body">
              <div className="ticket-column">
                <div className="ticket-photo">
                  <img
                    src={ticket?.photo_url ? ticket.photo_url : DEFAULT_PHOTO}
                    alt="User"
                    className="ticket-photo-image"
                  />
                </div>
              </div>
              <div className="ticket-column-2">
                <div className="ticket-contact">
                  {ticket.contact || "Unknown Contact"}
                </div>
                <div className="ticket-contact">Phone: {formattedPhone}</div>
                <div className="ticket-tags">
                  {tags.map((tag) => (
                    <Tag key={tag}>{truncateText(tag, 15)}</Tag>
                  ))}
                </div>
              </div>
              <div className="ticket-column">
                <div className="ticket-date">{ticket.creation_date}</div>
                <div
                  className="ticket-date"
                  style={{
                    color:
                      ticket.creation_date === ticket.last_interaction_date
                        ? "red"
                        : "green",
                    textShadow: "1px 1px 2px black"
                  }}
                >
                  {ticket.last_interaction_date}
                </div>
                <div className="ticket-id">#{ticket.id}</div>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <Modal
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        title=""
        width={1850}
        height={1000}
        footer={null}
        showCloseButton={false}
      >
        <SingleChat ticketId={ticket.id} onClose={() => setIsChatOpen(false)} />
      </Modal>
    </div>
  )
}

export default TicketCard
