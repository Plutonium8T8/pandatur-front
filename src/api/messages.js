import { baseAxios } from "./baseAxios"

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
      const { data } = await baseAxios.post("/messages/send", body)

      return data
    },

    telegram: async (body) => {
      const { data } = await baseAxios.post("/messages/send/telegram", body)

      return data
    },

    viber: async (body) => {
      const { data } = await baseAxios.post("/messages/send/viber", body)

      return data
    },

    whatsapp: async (body) => {
      const { data } = await baseAxios.post("/messages/send/whatsapp", body)

      return data
    }
  }
}
