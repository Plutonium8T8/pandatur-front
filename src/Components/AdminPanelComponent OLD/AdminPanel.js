import React, { useState, useEffect } from "react"
import { startOfWeek, addDays, format } from "date-fns"
import ModalWithToggles from "./ModalWithToggles" // Импортируем компонент модалки
import "./AdminPanel.css"
import { FaMinus, FaPlus, FaTrash } from "react-icons/fa"
import { translations } from "../utils/translations"
import ToggleComponent from "./ToggleComponent"
import { api } from "../../api"
import { useSnackbar } from "notistack"
import { showServerError } from "../../Components/utils/showServerError"
import { Spin } from "../Spin"

const ScheduleComponent = () => {
  const [schedule, setSchedule] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [intervals, setIntervals] = useState([]) // Для хранения интервалов выбранного дня
  const [isModalOpen, setIsModalOpen] = useState(false) // Состояние модалки
  const [selectedUser, setSelectedUser] = useState(null) // Хранит выбранного пользователя
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { enqueueSnackbar } = useSnackbar()
  const language = localStorage.getItem("language") || "RO"

  // Закрытие модалки
  const closeModal = () => {
    setSelectedUser(null)
    setIsModalOpen(false)
  }

  const handleShiftChange = (employeeIndex, dayIndex) => {
    setSelectedEmployee(employeeIndex)
    setSelectedDay(dayIndex)

    const currentShifts = schedule[employeeIndex].shifts[dayIndex] || []
    setIntervals([...currentShifts]) // Теперь intervals - это массив объектов
  }

  const removeInterval = async (index) => {
    try {
      // Получаем данные о текущем сотруднике и выбранном дне
      const technicianId = schedule[selectedEmployee]?.id
      const dayOfWeek = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
      ][selectedDay]

      // Интервал, который нужно удалить
      const intervalToDelete = intervals[index]

      await api.technicians.deleteSchedule(technicianId, dayOfWeek, {
        start: intervalToDelete.start,
        end: intervalToDelete.end,
        timezone: "EST" // Используйте временной пояс, подходящий вашему приложению
      })

      const updatedIntervals = intervals.filter((_, i) => i !== index)
      setIntervals(updatedIntervals)
      fetchData()
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" })
    }
  }

  const saveShift = () => {
    const updatedSchedule = [...schedule]
    updatedSchedule[selectedEmployee].shifts[selectedDay] = [...intervals]
    setSchedule(updatedSchedule)
    setSelectedEmployee(null)
    setSelectedDay(null)
    setIntervals([])
  }

  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
  }

  useEffect(() => {
    api.users
      .getTechnicianList()
      .then((response) => response.json())
      .then((data) => {
        const formattedSchedule = data.map((technician) => ({
          id: technician.id.id.id,
          name: `${technician.id.name} ${technician.id.surname}`,
          shifts: Array(7)
            .fill([])
            .map((_, index) => {
              const day = [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday"
              ][index]
              return (
                technician.weekly_schedule?.[day]?.map((interval) => ({
                  start: interval.start,
                  end: interval.end
                })) || []
              )
            })
        }))
        setSchedule(formattedSchedule)
      })
      .catch((error) => console.error("Ошибка загрузки данных:", error))
  }, [])

  const calculateWorkedHours = (shifts) => {
    if (!Array.isArray(shifts) || shifts.length === 0) return 0
    return shifts.reduce((total, shift) => {
      const startTime = parseTime(shift.start)
      const endTime = parseTime(shift.end)
      return total + (endTime - startTime)
    }, 0)
  }

  const parseTime = (time) => {
    if (!time) return 0
    const [hours, minutes] = time.split(":").map(Number)
    return hours + minutes / 60
  }

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7))
  }

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7))
  }

  const fetchData = async () => {
    try {
      setIsLoading(true) // Начало загрузки

      const usersData = await api.users.getTechnicianList()

      const scheduleData = await api.technicians.getSchedules()

      const combinedSchedule = usersData.map((user) => {
        const userId = user.id.id
        const userSchedule = scheduleData.find(
          (schedule) => schedule.technician_id === userId
        )

        const weeklySchedule = userSchedule?.weekly_schedule || {}

        const shifts = [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday"
        ].map((day) =>
          Array.isArray(weeklySchedule[day]) ? weeklySchedule[day] : []
        )

        return {
          id: userId,
          name: `${user.id.name} ${user.id.surname}`,
          email: user.id.user.email,
          username: user.id.user.username,
          roles: user.id.user.roles,
          shifts
        }
      })

      setSchedule(combinedSchedule)
    } catch (error) {
      console.error("Ошибка загрузки данных:", error)
    } finally {
      setIsLoading(false) // Окончание загрузки
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const mapDayToIndex = (day) => {
    if (!day) return -1
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday"
    ]
    return days.indexOf(day.toLowerCase())
  }

  const formatDaySchedule = (daySchedule) => {
    if (Array.isArray(daySchedule) && daySchedule.length > 0) {
      return daySchedule
        .filter((interval) => interval.start && interval.end) // Убираем пустые интервалы
        .map((interval) => `${interval.start} - ${interval.end}`)
        .join(", ")
    }
    return "-" // Если интервалов нет, возвращаем "-"
  }

  const cutInterval = async () => {
    try {
      // Получаем данные о текущем сотруднике и выбранном дне
      const technicianId = schedule[selectedEmployee]?.id
      const dayOfWeek = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
      ][selectedDay]

      // Формируем новый интервал
      const newInterval = {
        start: startTime || "", // Если поле пустое, отправляем пустую строку
        end: endTime || "", // Если поле пустое, отправляем пустую строку
        timezone: "EST" // Указываем временную зону
      }

      // Логируем данные перед отправкой
      console.log("Отправляем данные на сервер:", newInterval)

      // Отправляем POST-запрос на сервер

      await api.technicians.deleteSchedule(technicianId, dayOfWeek, newInterval)

      // Обновляем локальное состояние
      setIntervals((prev) => [...prev, newInterval])
      setStartTime("")
      setEndTime("")
      fetchData()
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" })
    }
  }

  const addInterval = async () => {
    try {
      // Получаем данные о текущем сотруднике и выбранном дне
      const technicianId = schedule[selectedEmployee]?.id
      const dayOfWeek = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
      ][selectedDay]

      // Формируем новый интервал
      const newInterval = {
        start: startTime || "", // Если поле пустое, отправляем пустую строку
        end: endTime || "", // Если поле пустое, отправляем пустую строку
        timezone: "EST" // Указываем временную зону
      }

      await api.technicians.createSchedule(technicianId, dayOfWeek, newInterval)

      setIntervals((prev) => [...prev, newInterval])
      setStartTime("")
      setEndTime("")
      fetchData()
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" })
    }
  }

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center h-full">
        <Spin />
      </div>
    )
  }

  return (
    <div className="schedule-container">
      <div className="header-component">
        {translations["Grafic de lucru"][language]}
      </div>

      <div className="week-navigation">
        <button onClick={goToPreviousWeek}>
          {translations["săptămâna"][language]}{" "}
          {translations["trecută"][language]}
        </button>
        <span>
          {translations["săptămâna"][language]}{" "}
          {format(currentWeekStart, "dd.MM.yyyy")} -{" "}
          {format(addDays(currentWeekStart, 6), "dd.MM.yyyy")}
        </span>
        <button onClick={goToNextWeek}>
          {translations["săptămâna"][language]}{" "}
          {translations["viitoare"][language]}
        </button>
      </div>
      <div className="schedule-table-container">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>{translations["Angajat"][language]}</th>
              {getWeekDays().map((day, index) => (
                <th key={index}>
                  {translations[format(day, "EEEE")][language]},{" "}
                  {format(day, "dd.MM")}
                </th>
              ))}
              <th>{translations["Ore de lucru"][language]}</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((employee, employeeIndex) => (
              <tr
                key={employeeIndex}
                onClick={() => {
                  setSelectedUser(employee) // Открываем модалку с данными пользователя
                  setIsModalOpen(true)
                }}
              >
                <td>
                  {employee.name} ({employee.id})
                </td>
                {employee.shifts.map((shift, dayIndex) => (
                  <td
                    key={dayIndex}
                    className="shift-cell"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleShiftChange(employeeIndex, dayIndex)
                    }}
                  >
                    {Array.isArray(shift) && shift.length > 0
                      ? shift.map((interval, i) => (
                          <div key={i}>
                            {interval.start} - {interval.end}
                          </div>
                        ))
                      : "-"}
                  </td>
                ))}
                <td>
                  {employee.shifts
                    .reduce(
                      (total, shifts) => total + calculateWorkedHours(shifts),
                      0
                    )
                    .toFixed(2)}{" "}
                  h.
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модалка с переключателями */}

      {isModalOpen && selectedUser && (
        <ModalWithToggles
          employee={selectedUser}
          isOpen={isModalOpen} // Передаём выбранного пользователя
          closeModal={closeModal} // Передаём функцию закрытия
        />
      )}

      {selectedEmployee !== null && selectedDay !== null && (
        <div
          className="modal-overlay"
          onClick={() => {
            setSelectedEmployee(null)
            setSelectedDay(null)
            setIntervals([])
          }}
        >
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>
                {schedule[selectedEmployee].name} (
                {schedule[selectedEmployee].id}),{" "}
                {
                  translations[format(getWeekDays()[selectedDay], "EEEE")][
                    language
                  ]
                }{" "}
                , {format(getWeekDays()[selectedDay], "dd.MM")}
              </h2>
            </header>
            {error && <div className="error-message">{error}</div>}
            <form
              className="notification-form"
              onSubmit={(e) => {
                e.preventDefault() // Предотвращаем действие по умолчанию
                // Ваш код сохранения данных
              }}
            >
              <div className="input-group">
                <div className="time-inputs">
                  {intervals.map((interval, index) => (
                    <div key={index} className="time-interval">
                      <label>
                        Start
                        <input
                          type="time"
                          value={interval.start}
                          onChange={(e) => {
                            const updatedIntervals = [...intervals]
                            updatedIntervals[index].start = e.target.value
                            setIntervals(updatedIntervals)
                          }}
                        />
                      </label>
                      <label>
                        End
                        <input
                          type="time"
                          value={interval.end}
                          onChange={(e) => {
                            const updatedIntervals = [...intervals]
                            updatedIntervals[index].end = e.target.value
                            setIntervals(updatedIntervals)
                          }}
                        />
                      </label>
                      <button
                        type="button" // Предотвращаем отправку формы
                        className="delete-button"
                        onClick={() => removeInterval(index)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                  <div className="add-interval">
                    <label>
                      Start
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </label>
                    <label>
                      End
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </label>
                    <button
                      type="button" // Добавлено, чтобы предотвратить отправку формы
                      className="add-button-plus"
                      onClick={addInterval}
                    >
                      <FaPlus />
                    </button>
                    <button
                      type="button" // Добавлено, чтобы предотвратить отправку формы
                      className="add-button-minus"
                      onClick={cutInterval}
                    >
                      <FaMinus />
                    </button>
                  </div>
                </div>
                <div className="button-container">
                  <button
                    type="submit" // Если нужно отправить форму
                    className="submit-button"
                    onClick={saveShift}
                  >
                    {translations["Salvează"][language]}
                  </button>
                  <button
                    type="button" // Добавлено, чтобы избежать отправки формы
                    className="clear-button"
                    onClick={() => {
                      setSelectedEmployee(null)
                      setSelectedDay(null)
                      setIntervals([])
                    }}
                  >
                    {translations["Închide"][language]}
                  </button>
                </div>
              </div>
            </form>
            <ToggleComponent employee={selectedEmployee} />
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduleComponent
