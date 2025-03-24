import React, { useState, useEffect } from "react"
import { startOfWeek, addDays, format } from "date-fns"
import { FaMinus, FaPlus, FaTrash } from "react-icons/fa"
import { translations } from "../utils/translations"
import { api } from "../../api"
import { useSnackbar } from "notistack"
import { showServerError } from "../utils/showServerError"
import { Spin } from "../Spin"

const GroupScheduleView = ({ groupUsers }) => {
  const [schedule, setSchedule] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [intervals, setIntervals] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { enqueueSnackbar } = useSnackbar()
  const language = localStorage.getItem("language") || "RO"

  const closeModal = () => {
    setSelectedUser(null)
    setIsModalOpen(false)
  }

  const handleShiftChange = (employeeIndex, dayIndex) => {
    setSelectedEmployee(employeeIndex)
    setSelectedDay(dayIndex)
    const currentShifts = schedule[employeeIndex].shifts[dayIndex] || []
    setIntervals([...currentShifts])
  }

  const removeInterval = async (index) => {
    try {
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

      const intervalToDelete = intervals[index]

      await api.technicians.deleteSchedule(technicianId, dayOfWeek, {
        start: intervalToDelete.start,
        end: intervalToDelete.end,
        timezone: "EST"
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

  const getWeekDays = () =>
    Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7))
  }

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7))
  }

  const calculateWorkedHours = (shifts) => {
    if (!Array.isArray(shifts) || shifts.length === 0) return 0
    return shifts.reduce((total, shift) => {
      const start = parseTime(shift.start)
      const end = parseTime(shift.end)
      return total + (end - start)
    }, 0)
  }

  const parseTime = (time) => {
    if (!time) return 0
    const [hours, minutes] = time.split(":").map(Number)
    return hours + minutes / 60
  }

  const fetchData = async () => {
    try {
      setIsLoading(true)

      const scheduleData = await api.schedules.getSchedules()

      const combined = groupUsers.map((user) => {
        const userId = user.id
        const userSchedule = scheduleData.find(
          (s) => s.technician_id === userId
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
          name: user.name,
          shifts
        }
      })

      setSchedule(combined)
    } catch (error) {
      console.error("Ошибка загрузки расписания:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [groupUsers])

  const addInterval = async () => {
    try {
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

      const newInterval = {
        start: startTime || "",
        end: endTime || "",
        timezone: "EST"
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

  const cutInterval = async () => {
    try {
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

      const interval = {
        start: startTime || "",
        end: endTime || "",
        timezone: "EST"
      }

      await api.technicians.deleteSchedule(technicianId, dayOfWeek, interval)

      setIntervals((prev) => [...prev, interval])
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
                  setSelectedUser(employee)
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
                    {shift.length > 0
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

            <form
              className="notification-form"
              onSubmit={(e) => e.preventDefault()}
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
                            const updated = [...intervals]
                            updated[index].start = e.target.value
                            setIntervals(updated)
                          }}
                        />
                      </label>
                      <label>
                        End
                        <input
                          type="time"
                          value={interval.end}
                          onChange={(e) => {
                            const updated = [...intervals]
                            updated[index].end = e.target.value
                            setIntervals(updated)
                          }}
                        />
                      </label>
                      <button
                        type="button"
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
                      type="button"
                      className="add-button-plus"
                      onClick={addInterval}
                    >
                      <FaPlus />
                    </button>
                    <button
                      type="button"
                      className="add-button-minus"
                      onClick={cutInterval}
                    >
                      <FaMinus />
                    </button>
                  </div>
                </div>

                <div className="button-container">
                  <button
                    type="submit"
                    className="submit-button"
                    onClick={saveShift}
                  >
                    {translations["Salvează"][language]}
                  </button>
                  <button
                    type="button"
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
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupScheduleView
