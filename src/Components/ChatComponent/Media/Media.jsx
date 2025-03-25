import { Box } from "@mantine/core"
import { getLanguageByKey } from "../../utils"
import "./Media.css"

export const Media = ({ messages, selectTicketId }) => {
  return (
    <Box p="md">
      {messages
        .filter(
          (msg) =>
            ["audio", "video", "image", "file"].includes(msg.mtype) &&
            msg.ticket_id === selectTicketId
        )
        .map((msg, index) => (
          <div key={index} className="media-container">
            <div className="sent-time">
              {(() => {
                const parseCustomDate = (dateStr) => {
                  if (!dateStr) return "—"
                  const [datePart, timePart] = dateStr.split(" ")
                  const [day, month, year] = datePart.split("-").map(Number)
                  const [hours, minutes, seconds] = timePart
                    .split(":")
                    .map(Number)
                  return new Date(year, month - 1, day, hours, minutes, seconds)
                }
                return parseCustomDate(msg.time_sent).toLocaleString("ru-RU", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit"
                })
              })()}
            </div>

            {msg.mtype === "image" ? (
              <img
                src={msg.message}
                alt=""
                className="image-preview-in-chat"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/300?text=Ошибка+загрузки"
                }}
                onClick={() => {
                  window.open(msg.message, "_blank")
                }}
              />
            ) : msg.mtype === "video" ? (
              <video controls className="video-preview">
                <source src={msg.message} type="video/mp4" />
                {getLanguageByKey("Acest browser nu suporta video")}
              </video>
            ) : msg.mtype === "audio" ? (
              <audio controls className="audio-preview">
                <source src={msg.message} type="audio/ogg" />
                {getLanguageByKey("Acest browser nu suporta audio")}
              </audio>
            ) : msg.mtype === "file" ? (
              <a href={msg.message} target="_blank" rel="noopener noreferrer">
                {getLanguageByKey("Deschide file") || "Открыть файл"}
              </a>
            ) : null}
          </div>
        ))}
    </Box>
  )
}
