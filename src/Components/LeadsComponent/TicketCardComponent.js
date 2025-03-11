import React, { useState } from "react";
import { Link } from "react-router-dom";
import { truncateText, parseTags } from "../../stringUtils";
import { getPriorityColor } from "../utils/ticketUtils";
import "./TicketCardComponent.css";
import { Modal } from "../Modal";
import SingleChat from "../ChatComponent/SingleChat";

const TicketCard = ({ ticket, onEditTicket }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const tags = parseTags(ticket.tags);

  const formattedPhone =
    ticket.phone &&
      ticket.phone.trim() !== "" &&
      ticket.phone.replace(/[{}]/g, "").trim().toLowerCase() !== "null"
      ? ticket.phone.replace(/[{}]/g, "").trim()
      : "Unknown number";

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
          <button
            className="action-button-ticket"
            onClick={() => setIsChatOpen(true)}
          >
            Open
          </button>
        </div>
      )}

      <Link to={`/chat/${ticket.id}`} className="ticket-link">
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
                    src={
                      "https://storage.googleapis.com/pandatur_bucket/utils/icon-5359554_640.webp"
                    }
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
                  {tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {truncateText(tag, 15)}
                    </span>
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
                    textShadow: "1px 1px 2px black",
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

      {/* Модальное окно с SingleChat, передаем ticketId */}
      <Modal open={isChatOpen} onClose={() => setIsChatOpen(false)} title="Чат" width={800} height={600}>
        <SingleChat ticketId={ticket.id} />
      </Modal>
    </div>
  );
};

export default TicketCard;