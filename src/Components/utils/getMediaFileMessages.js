const FORMAT_MEDIA = ["audio", "video", "image", "file"];

export const getMediaFileMessages = (messageList, id) => {
  return messageList.filter(
    (msg) => FORMAT_MEDIA.includes(msg.mtype) && msg.ticket_id === id,
  );
};
