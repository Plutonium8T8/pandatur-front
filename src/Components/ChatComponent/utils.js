import { getLanguageByKey } from "../utils";

export const getMediaType = (mimeType) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
};

export const renderContent = (msg) => {
  if (!msg.message) {
    return (
      <div className="text-message">{getLanguageByKey("Mesajul lipseste")}</div>
    );
  }
  switch (msg.mtype) {
    case "image":
      return (
        <img
          src={msg.message}
          alt="Изображение"
          className="image-preview-in-chat"
          onError={(e) => {
            e.target.src =
              "https://via.placeholder.com/300?text=Ошибка+загрузки";
          }}
          onClick={() => {
            window.open(msg.message, "_blank");
          }}
        />
      );
    case "video":
      return (
        <video controls className="video-preview">
          <source src={msg.message} type="video/mp4" />
          {getLanguageByKey("Acest browser nu suporta video")}
        </video>
      );
    case "audio":
      return (
        <audio controls className="audio-preview">
          <source src={msg.message} type="audio/ogg" />
          {getLanguageByKey("Acest browser nu suporta audio")}
        </audio>
      );
    case "file":
      return (
        <a
          href={msg.message}
          target="_blank"
          rel="noopener noreferrer"
          className="file-link"
        >
          {getLanguageByKey("Deschide file")}
        </a>
      );
    default:
      return <div className="text-message">{msg.message}</div>;
  }
};
