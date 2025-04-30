export const MAX_PAGE_SIZE = 100;
export const ISO_DATE = "yyyy-MM-dd";
export const DD_MM_YYYY = "DD.MM.YYYY";
export const DD_MM_YYYY__HH_mm_ss = "DD-MM-YYYY HH:mm:ss";
export const HH_mm = "HH:mm";

export const DEFAULT_PHOTO =
  "https://storage.googleapis.com/pandatur_bucket/utils/icon-5359554_640.webp";

export const FALLBACK_IMAGE =
  "https://www.okm.md/_ipx/f_webp&q_75/fallback.webp";

export const MEDIA_TYPE = {
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  FILE: "file",
  URL: "url",
  CALL: "call",
};

export const MEDIA_TYPE_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "audio", label: "Audio" },
  { value: "file", label: "File" },
  { value: "url", label: "URL" },
  { value: "call", label: "Call" },
  { value: "video", label: "Video" },
];

export const PLATFORMS = {
  VIBER: "viber",
  TELEGRAM: "telegram",
  FACEBOOK: "facebook",
};

export const TYPE_SOCKET_EVENTS = {
  SEEN: "seen",
  MESSAGE: "message",
  TICKET: "ticket",
  CONNECT: "connect",
};

export const TYPE_TICKET = {
  HARD: "hard",
  LIGHT: "light",
};
