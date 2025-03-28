import { baseAxios } from "./baseAxios"

export const schedules = {
  // Получить все расписания
  getSchedules: async () => {
    const { data } = await baseAxios.get("/api/technicians/schedules")
    return data
  },

  // Добавить интервал нескольким техникам
  addTimeframe: async (payload) => {
    const { data } = await baseAxios.post(
      "/api/technicians/schedule/timeframe",
      payload
    )
    return data
  },

  // Удалить интервал у нескольких техников
  removeTimeframe: async (payload) => {
    const { data } = await baseAxios.delete(
      "/api/technicians/schedule/timeframe",
      { data: payload }
    )
    return data
  },

  // Удалить расписание по дням у нескольких техников
  deleteWeekdays: async (payload) => {
    const { data } = await baseAxios.delete(
      "/api/technicians/schedule/weekday",
      { data: payload }
    )
    return data
  },

  // Получить расписание одного техника
  getTechnicianSchedule: async (technicianId) => {
    const { data } = await baseAxios.get(
      `/api/technicians/${technicianId}/schedule`
    )
    return data
  },

  // Обновить полностью расписание одного техника
  updateTechnicianSchedule: async (technicianId, schedule) => {
    const { data } = await baseAxios.post(
      `/api/technicians/${technicianId}/schedule`,
      schedule
    )
    return data
  }
}
