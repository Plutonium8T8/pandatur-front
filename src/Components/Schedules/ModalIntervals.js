import React, { useState, useEffect } from "react";
import { Drawer, Stack, Group, TextInput, Button } from "@mantine/core";
import { FaTrash, FaPlus, FaMinus } from "react-icons/fa";
import { api } from "../../api";
import { useSnackbar } from "notistack";
import { showServerError } from "../utils/showServerError";
import { translations } from "../utils/translations";

const language = localStorage.getItem("language") || "RO";

const ModalIntervals = ({
  opened,
  onClose,
  schedule,
  selected,
  fetchData,
  selectedTechnicians = [],
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [intervals, setIntervals] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);

  const dayNames = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const dayApiNames = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  const dayButtons = [
    { label: "Mo", value: "monday" },
    { label: "Tu", value: "tuesday" },
    { label: "We", value: "wednesday" },
    { label: "Th", value: "thursday" },
    { label: "Fr", value: "friday" },
    { label: "Sa", value: "saturday" },
    { label: "Su", value: "sunday" },
  ];

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  useEffect(() => {
    if (opened && selected.employeeIndex !== null) {
      const defaultDay = dayNames[selected.dayIndex];
      setSelectedDays([defaultDay]);
      const current =
        schedule[selected.employeeIndex]?.shifts[selected.dayIndex] || [];
      setIntervals([...current]);
    }
  }, [opened, selected, schedule]);

  const getTechnicianIds = () => {
    if (selectedTechnicians.length > 0) {
      return selectedTechnicians;
    }
    return [schedule[selected.employeeIndex]?.id];
  };

  const getWeekdays = () => selectedDays.map((d) => dayApiNames[d]);

  const addInterval = async () => {
    try {
      await api.schedules.addTimeframe({
        technician_ids: getTechnicianIds(),
        weekdays: getWeekdays(),
        start: startTime,
        end: endTime,
      });
      setStartTime("");
      setEndTime("");
      fetchData();
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" });
    }
  };

  const cutInterval = async () => {
    try {
      await api.schedules.removeTimeframe({
        technician_ids: getTechnicianIds(),
        weekdays: getWeekdays(),
        start: startTime,
        end: endTime,
      });
      setStartTime("");
      setEndTime("");
      fetchData();
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" });
    }
  };

  const deleteByDays = async () => {
    try {
      await api.schedules.deleteWeekdays({
        technician_ids: getTechnicianIds(),
        weekdays: getWeekdays(),
      });
      fetchData();
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" });
    }
  };

  const removeInterval = async (index) => {
    const interval = intervals[index];
    try {
      await api.schedules.removeTimeframe({
        technician_ids: [schedule[selected.employeeIndex].id],
        weekdays: [dayApiNames[dayNames[selected.dayIndex]]],
        start: interval.start,
        end: interval.end,
      });
      setIntervals((prev) => prev.filter((_, i) => i !== index));
      fetchData();
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" });
    }
  };

  const getSelectedNames = () => {
    if (selectedTechnicians.length > 1) {
      const names = schedule
        .filter((s) => selectedTechnicians.includes(s.id))
        .map((s) => `${s.name} (${s.id})`);
      return (
        <>
          <div style={{ fontWeight: 500, marginBottom: 5 }}>
            {translations["Utilizatori selectați"][language]}:
          </div>
          <div>{names.join(", ")}</div>
        </>
      );
    }

    if (selectedTechnicians.length === 1) {
      const tech = schedule.find((s) => s.id === selectedTechnicians[0]);
      return tech ? `${tech.name} (${tech.id})` : "";
    }

    return selected.employeeIndex !== null
      ? `${schedule[selected.employeeIndex]?.name} (${schedule[selected.employeeIndex]?.id})`
      : translations["Intervale pentru mai mulți tehnicieni"][language];
  };

  const title = getSelectedNames();

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
            <Button
              size="xs"
              variant={
                selectedDays.length === dayButtons.length ? "filled" : "light"
              }
              onClick={() => {
                if (selectedDays.length === dayButtons.length) {
                  setSelectedDays([]);
                } else {
                  setSelectedDays(dayButtons.map((d) => d.value));
                }
              }}
              style={{ width: 65 }}
            >
              {translations["Toate"][language]}
            </Button>

            {dayButtons.map((day) => (
              <Button
                key={day.value}
                size="xs"
                variant={
                  selectedDays.includes(day.value) ? "filled" : "default"
                }
                onClick={() => toggleDay(day.value)}
                style={{ width: 54 }}
              >
                {day.label}
              </Button>
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
              <Button onClick={deleteByDays} variant="light" color="red">
                <FaTrash />
              </Button>
            </Group>
          </Group>

          {selectedTechnicians.length <= 1 &&
            intervals.length > 0 &&
            selected.employeeIndex !== null && (
              <div style={{ marginTop: 10, fontWeight: 500 }}>
                {translations["Intervale pentru"][language]}{" "}
                {schedule[selected.employeeIndex]?.name} (
                {schedule[selected.employeeIndex]?.id})
              </div>
            )}

          {selectedTechnicians.length <= 1 &&
            intervals.map((interval, index) => (
              <Group key={index} align="flex-end">
                <TextInput
                  type="time"
                  label="Start"
                  value={interval.start}
                  onChange={(e) => {
                    const updated = [...intervals];
                    updated[index].start = e.target.value;
                    setIntervals(updated);
                  }}
                />
                <TextInput
                  type="time"
                  label="End"
                  value={interval.end}
                  onChange={(e) => {
                    const updated = [...intervals];
                    updated[index].end = e.target.value;
                    setIntervals(updated);
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

          <Group mt="xl" grow>
            <Button onClick={onClose} variant="default">
              {translations["Închide"][language]}
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
};

export default ModalIntervals;
