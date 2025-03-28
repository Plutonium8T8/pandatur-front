import React, { useState, useEffect } from "react"
import { Drawer, Stack, Group, TextInput, Button } from "@mantine/core"
import { FaTrash, FaPlus, FaMinus } from "react-icons/fa"
import { api } from "../../api"
import { useSnackbar } from "notistack"
import { showServerError } from "../utils/showServerError"
import { translations } from "../utils/translations"

const ModalIntervals = ({
  opened,
  onClose,
  schedule,
  selected,
  setSchedule,
  fetchData
}) => {
  const { enqueueSnackbar } = useSnackbar()
  const language = localStorage.getItem("language") || "RO"
  const [intervals, setIntervals] = useState([])
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [selectedDays, setSelectedDays] = useState([])

  const dayNames = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
  ]

  const dayApiNames = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday"
  }

  const dayButtons = [
    { label: "Mo", value: "monday" },
    { label: "Tu", value: "tuesday" },
    { label: "We", value: "wednesday" },
    { label: "Th", value: "thursday" },
    { label: "Fr", value: "friday" },
    { label: "Sa", value: "saturday" },
    { label: "Su", value: "sunday" }
  ]

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  useEffect(() => {
    if (opened && selected.employeeIndex !== null) {
      const defaultDay = dayNames[selected.dayIndex]
      setSelectedDays([defaultDay])
      const current =
        schedule[selected.employeeIndex]?.shifts[selected.dayIndex] || []
      setIntervals([...current])
    }
  }, [opened, selected, schedule])

  const save = () => {
    const updated = [...schedule]
    updated[selected.employeeIndex].shifts[selected.dayIndex] = [...intervals]
    setSchedule(updated)
    onClose()
  }

  const getTechnicianIds = () => {
    return [schedule[selected.employeeIndex].id]
  }

  const getWeekdays = () => {
    return selectedDays.map((d) => dayApiNames[d])
  }

  const addInterval = async () => {
    try {
      const payload = {
        technician_ids: getTechnicianIds(),
        weekdays: getWeekdays(),
        start: startTime,
        end: endTime
      }
      await api.schedules.addTimeframe(payload)
      setStartTime("")
      setEndTime("")
      fetchData()
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" })
    }
  }

  const cutInterval = async () => {
    try {
      const payload = {
        technician_ids: getTechnicianIds(),
        weekdays: getWeekdays(),
        start: startTime,
        end: endTime
      }
      await api.schedules.removeTimeframe(payload)
      setStartTime("")
      setEndTime("")
      fetchData()
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" })
    }
  }

  const removeInterval = async (index) => {
    const interval = intervals[index]
    try {
      await api.schedules.removeTimeframe({
        technician_ids: getTechnicianIds(),
        weekdays: [dayApiNames[dayNames[selected.dayIndex]]],
        start: interval.start,
        end: interval.end
      })
      setIntervals((prev) => prev.filter((_, i) => i !== index))
      fetchData()
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" })
    }
  }

  const deleteDays = async () => {
    try {
      const payload = {
        technician_ids: getTechnicianIds(),
        weekdays: getWeekdays()
      }

      await api.schedules.deleteWeekdays(payload)
      fetchData()
      onClose()
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" })
    }
  }

  const title =
    opened && selected.employeeIndex !== null
      ? `${schedule[selected.employeeIndex].name} (${schedule[selected.employeeIndex].id})`
      : ""

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={title}
      position="right"
      size="lg"
      padding="xl"
    >
      <form onSubmit={(e) => e.preventDefault()}>
        <Stack>
          <Group spacing="xs" mt="xs">
            {dayButtons.map((day) => (
              <Button
                key={day.value}
                size="xs"
                variant={
                  selectedDays.includes(day.value) ? "filled" : "default"
                }
                onClick={() => toggleDay(day.value)}
                style={{ width: 36, padding: 0 }}
              >
                {day.label}
              </Button>
            ))}
          </Group>
          {intervals.map((interval, index) => (
            <Group key={index} align="flex-end">
              <TextInput
                type="time"
                label="Start"
                value={interval.start}
                onChange={(e) => {
                  const updated = [...intervals]
                  updated[index].start = e.target.value
                  setIntervals(updated)
                }}
              />
              <TextInput
                type="time"
                label="End"
                value={interval.end}
                onChange={(e) => {
                  const updated = [...intervals]
                  updated[index].end = e.target.value
                  setIntervals(updated)
                }}
              />
              <Button
                variant="light"
                color="red"
                onClick={() => removeInterval(index)}
              >
                <FaTrash />
              </Button>
            </Group>
          ))}

          <Group align="flex-end" mt="md">
            <TextInput
              type="time"
              label="Start"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <TextInput
              type="time"
              label="End"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
            <Button onClick={addInterval} variant="light" color="green">
              <FaPlus />
            </Button>
            <Button onClick={cutInterval} variant="light" color="yellow">
              <FaMinus />
            </Button>
          </Group>

          <Group mt="xl" grow>
            <Button onClick={save} color="blue">
              {translations["Salvează"][language]}
            </Button>
            <Button variant="default" onClick={onClose}>
              {translations["Închide"][language]}
            </Button>
            <Button color="red" variant="outline" onClick={deleteDays}>
              {translations["Șterge interval dupa zile"][language]}
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  )
}

export default ModalIntervals
