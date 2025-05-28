import { baseAxios } from "./baseAxios"
import Cookies from "js-cookie"

export const messages = {
  list: async () => {
    const { data } = await baseAxios.get("/api/messages")

    return data
  },

  messagesTicketById: async (id) => {
    const { data } = await baseAxios.get(`/api/messages/ticket/${id}`)

    return data
  },

  upload: async (body) => {
    const { data } = await baseAxios.post("/api/messages/upload", body, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })

    return data
  },

  send: {
    create: async (body) => {
      const token = Cookies.get("jwt");
      const { data } = await baseAxios.post("/messages/send", body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return data;
    },

    telegram: async (body) => {
      const token = Cookies.get("jwt");
      const { data } = await baseAxios.post("/messages/send/telegram", body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return data;
    },

    viber: async (body) => {
      const token = Cookies.get("jwt");
      const { data } = await baseAxios.post("/messages/send/viber", body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return data;
    },

    whatsapp: async (body) => {
      const token = Cookies.get("jwt");
      const { data } = await baseAxios.post("/messages/send/whatsapp", body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return data;
    }
  },
}
