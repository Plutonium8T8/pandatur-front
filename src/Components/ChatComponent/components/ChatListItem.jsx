import { DEFAULT_PHOTO } from "../../../app-constants"

const formatDateTime = (dateString) => {
  if (!dateString) return "—"

  const parts = dateString.split(" ")
  if (parts.length !== 2) return "—"

  const [datePart, timePart] = parts
  const [day, month, year] = datePart.split("-")

  if (!day || !month || !year) return "—"

  const formattedDate = new Date(`${year}-${month}-${day}T${timePart}`)

  return (
    formattedDate.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit"
    }) || "—"
  )
}

export const ChatListItem = ({
  chat,
  style,
  onHandleTicketClick,
  selectTicketId
}) => {
  return (
    <div style={style}>
      <div
        key={chat.id}
        className={`chat-item ${chat.id === selectTicketId ? "active" : ""}`}
        onClick={() => onHandleTicketClick(chat.id)}
        data-ticket-id={chat.id}
      >
        <div className="foto-description">
          <img
            className="foto-user"
            src={chat?.photo_url ? chat.photo_url : DEFAULT_PHOTO}
            alt="example"
          />
          <div className="tickets-descriptions">
            <div>{chat.contact || "no contact"}</div>
            <div>{chat.id ? `Lead: #${chat.id}` : "no id"}</div>
            <div>{chat.workflow || "no workflow"}</div>
          </div>
        </div>
        <div className="container-time-tasks-chat">
          <div className="info-message">
            <div className="last-message-container">
              <div className="last-message-ticket">
                {chat.last_message || "No messages"}
              </div>
              <div className="chat-time">{formatDateTime(chat.time_sent)}</div>
              {chat.unseen_count > 0 && (
                <div className="unread-count">{chat.unseen_count}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
