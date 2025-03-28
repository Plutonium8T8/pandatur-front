import { baseAxios } from "./baseAxios"

export const technicians = {
  // Получить все расписания
  getSchedules: async () => {
    const { data } = await baseAxios.get("/api/technicians/schedules")
    return data
  },

  // Добавить интервал на выбранные дни
  createSchedule: async (technicianId, body) => {
    const { data } = await baseAxios.post(
      `/api/technicians/${technicianId}/schedule`,
      body
    )
    return data
  },

  // Удалить конкретный интервал с выбранных дней
  deleteSchedule: async (technicianId, body) => {
    const { data } = await baseAxios.delete(
      `/api/technicians/${technicianId}/schedule/remove`,
      { data: body }
    )
    return data
  },

  // Полностью удалить интервалы по дням
  deleteScheduleDays: async (technicianId, weekdays) => {
    const { data } = await baseAxios.delete(
      `/api/technicians/${technicianId}/schedule/delete`,
      { data: { weekdays } }
    )
    return data
  }
}
