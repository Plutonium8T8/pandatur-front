import React, { useState, useEffect } from "react"
import { Drawer, Stack, Group, TextInput, Button } from "@mantine/core"
import { FaTrash, FaPlus, FaMinus } from "react-icons/fa"
import { api } from "../../api"
import { useSnackbar } from "notistack"
import { showServerError } from "../utils/showServerError"
import { format, startOfWeek, addDays } from "date-fns"
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
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

  const getWeekDay = (index) => addDays(currentWeekStart, index)
  const dayNames = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
  ]

  useEffect(() => {
    if (
      opened &&
      selected.employeeIndex !== null &&
      selected.dayIndex !== null
    ) {
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

  const addInterval = async () => {
    try {
      const id = schedule[selected.employeeIndex].id
      const day = dayNames[selected.dayIndex]
      const payload = { start: startTime, end: endTime, timezone: "EST" }
      await api.technicians.createSchedule(id, day, payload)
      setIntervals((prev) => [...prev, payload])
      setStartTime("")
      setEndTime("")
      fetchData()
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" })
    }
  }

  const cutInterval = async () => {
    try {
      const id = schedule[selected.employeeIndex].id
      const day = dayNames[selected.dayIndex]
      const payload = { start: startTime, end: endTime, timezone: "EST" }
      await api.technicians.deleteSchedule(id, day, payload)
      setIntervals((prev) => [...prev, payload])
      setStartTime("")
      setEndTime("")
      fetchData()
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" })
    }
  }

  const removeInterval = async (i) => {
    const id = schedule[selected.employeeIndex].id
    const day = dayNames[selected.dayIndex]
    const interval = intervals[i]
    try {
      await api.technicians.deleteSchedule(id, day, {
        start: interval.start,
        end: interval.end,
        timezone: "EST"
      })
      setIntervals(intervals.filter((_, idx) => idx !== i))
      fetchData()
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" })
    }
  }

  const title =
    opened && selected.employeeIndex !== null && selected.dayIndex !== null
      ? `${schedule[selected.employeeIndex].name} (${schedule[selected.employeeIndex].id}) — ${translations[format(getWeekDay(selected.dayIndex), "EEEE")][language]}, ${format(getWeekDay(selected.dayIndex), "dd.MM")}`
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
          </Group>
        </Stack>
      </form>
    </Drawer>
  )
}

export default ModalIntervals
