import { baseAxios } from "./baseAxios"

export const schedules = {
  // Получить все группы расписания
  getAllGroups: async () => {
    const { data } = await baseAxios.get("/api/schedule-groups")

    return data
  },

  // Создать новую группу
  createGroup: async (body) => {
    const { data } = await baseAxios.post("/api/schedule-groups", body)

    return data
  },

  // Получить одну группу по ID
  getGroupById: async (id) => {
    const { data } = await baseAxios.get(`/api/schedule-groups/${id}`)

    return data
  },

  // Обновить группу по ID
  updateGroup: async (id, body) => {
    const { data } = await baseAxios.put(`/api/schedule-groups/${id}`, body)

    return data
  },

  // Удалить группу по ID
  deleteGroup: async (id) => {
    await baseAxios.delete(`/api/schedule-groups/${id}`)
  },

  // Получить группы для техника
  getGroupsByTechnician: async (userId) => {
    const { data } = await baseAxios.get(
      `/api/schedule-groups/technician/${userId}`
    )

    return data
  },

  // Назначить техника в группу (одного)
  assignTechnician: async (groupId, userId) => {
    const { data } = await baseAxios.post(
      `/api/schedule-groups/${groupId}/assign/${userId}`
    )

    return data
  },

  // 🔄 Массово назначить техников в группу
  assignMultipleTechnicians: async (groupId, userIds) => {
    const { data } = await baseAxios.post(`/api/schedule-groups/assign`, {
      groupId,
      userIds
    })

    return data
  },

  // Удалить техника из группы
  removeTechnician: async (groupId, userId) => {
    const { data } = await baseAxios.delete(
      `/api/schedule-groups/${groupId}/remove/${userId}`
    )

    return data
  },

  // Получить список техников в группе
  getTechniciansInGroup: async (groupId) => {
    const { data } = await baseAxios.get(
      `/api/schedule-groups/${groupId}/technicians`
    )

    return data
  }
}
