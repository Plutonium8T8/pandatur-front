import React, { useEffect, useState } from "react"
import { startOfWeek, addDays, format } from "date-fns"
import { translations } from "../utils/translations"
import { api } from "../../api"
import { useSnackbar } from "notistack"
import { showServerError } from "../utils/showServerError"
import { Spin } from "../Spin"
import ShiftDrawer from "./ShiftDrawer"
import "..//AdminPanelComponent OLD/AdminPanel.css"

const GroupScheduleView = ({ groupUsers }) => {
  const [schedule, setSchedule] = useState([])
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [selected, setSelected] = useState({
    employeeIndex: null,
    dayIndex: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const language = localStorage.getItem("language") || "RO"
  const { enqueueSnackbar } = useSnackbar()

  const getWeekDays = () =>
    Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const scheduleData = await api.technicians.getSchedules()
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

        return { id: userId, name: user.name, shifts }
      })
      setSchedule(combined)
    } catch (e) {
      console.error("Ошибка загрузки расписания:", e)
      enqueueSnackbar(showServerError(e), { variant: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [groupUsers])

  const calculateWorkedHours = (shifts) => {
    return shifts
      .reduce((total, shift) => {
        return (
          total +
          shift.reduce(
            (sum, i) => sum + parseTime(i.end) - parseTime(i.start),
            0
          )
        )
      }, 0)
      .toFixed(2)
  }

  const parseTime = (time) => {
    if (!time) return 0
    const [h, m] = time.split(":").map(Number)
    return h + m / 60
  }

  const openDrawer = (employeeIndex, dayIndex) => {
    setSelected({ employeeIndex, dayIndex })
  }

  const closeDrawer = () => {
    setSelected({ employeeIndex: null, dayIndex: null })
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
        <button
          onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
        >
          {translations["săptămâna"][language]}{" "}
          {translations["trecută"][language]}
        </button>
        <span>
          {translations["săptămâna"][language]}{" "}
          {format(currentWeekStart, "dd.MM.yyyy")} -{" "}
          {format(addDays(currentWeekStart, 6), "dd.MM.yyyy")}
        </span>
        <button
          onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
        >
          {translations["săptămâna"][language]}{" "}
          {translations["viitoare"][language]}
        </button>
      </div>

      <div className="schedule-table-container">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>{translations["Angajat"][language]}</th>
              {getWeekDays().map((day, i) => (
                <th key={i}>
                  {translations[format(day, "EEEE")][language]},{" "}
                  {format(day, "dd.MM")}
                </th>
              ))}
              <th>{translations["Ore de lucru"][language]}</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((employee, ei) => (
              <tr key={ei}>
                <td>
                  {employee.name} ({employee.id})
                </td>
                {employee.shifts.map((shift, di) => (
                  <td
                    key={di}
                    className="shift-cell"
                    onClick={() => openDrawer(ei, di)}
                  >
                    {shift.length > 0
                      ? shift.map((i, idx) => (
                          <div key={idx}>
                            {i.start} - {i.end}
                          </div>
                        ))
                      : "-"}
                  </td>
                ))}
                <td>{calculateWorkedHours(employee.shifts)} h.</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ShiftDrawer
        opened={selected.employeeIndex !== null}
        onClose={closeDrawer}
        schedule={schedule}
        selected={selected}
        setSchedule={setSchedule}
        fetchData={fetchData}
      />
    </div>
  )
}

export default GroupScheduleView
