import { baseAxios } from "./baseAxios"

export const technicianDetails = {
  getAllTechnicianList: async () => {
    const { data } = await baseAxios.get(`/api/users-technicians/details`)

    return data
  },

  getSingleTechnician: async (id) => {
    const { data } = await baseAxios.get(
      `/api/users-technician/details?id=${id}`
    )

    return data
  },

  patchSingleTechnician: async (id, body) => {
    const { data } = await baseAxios.patch(
      `/api/users-technician/details?id=${id}`,
      body
    )

    return data
  },

  createTechnicianUser: async (body) => {
    const { data } = await baseAxios.post(
      "/api/technician/profile/create",
      body
    )

    return data
  }
}
