import { baseAxios } from "./baseAxios"

export const users = {
  getById: async (id) => {
    const { data } = await baseAxios.get(`/api/users/${id}`)

    return data
  },

  getTechnicianList: async () => {
    const { data } = await baseAxios.get("/api/users-technician")

    return data
  },

  createTechnicianUser: async (body) => {
    const { data } = await baseAxios.post(
      "/api/technician/profile/create",
      body
    )

    return data
  },

  getTechnicianById: async (id) => {
    const { data } = await baseAxios.get(`/api/users-technician/${id}`)

    return data
  },

  updateTechnician: async (id, body) => {
    const { data } = await baseAxios.patch(`/api/users-technician/${id}`, body)

    return data
  },

  getExtendedById: async (id) => {
    const { data } = await baseAxios.get(`/api/users-extended/${id}`)

    return data
  },

  updateExtended: async (id, body) => {
    const { data } = await baseAxios.patch(`/api/users-extended/${id}`, body)

    return data
  },

  updateUsernameAndEmail: async (id, body) => {
    const { data } = await baseAxios.patch(`/api/users/${id}`, body)

    return data
  },

  clientMerge: async (body) => {
    const { data } = await baseAxios.patch("/api/users-client/merge", body)

    return data
  }
}
