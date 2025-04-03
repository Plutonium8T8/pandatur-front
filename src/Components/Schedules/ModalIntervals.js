import React, { useState, useEffect } from "react";
import {
  Drawer,
  Stack,
  Group,
  TextInput,
  Button,
  ActionIcon,
  Text,
} from "@mantine/core";
import { FaTrash, FaPlus, FaMinus } from "react-icons/fa";
import { api } from "../../api";
import { useSnackbar } from "notistack";
import { showServerError } from "../utils/showServerError";
import { translations } from "../utils/translations";

const language = localStorage.getItem("language") || "RO";

const DAYS = [
  { label: translations["Mo"][language], value: "monday", apiName: "Monday" },
  { label: translations["Tu"][language], value: "tuesday", apiName: "Tuesday" },
  { label: translations["We"][language], value: "wednesday", apiName: "Wednesday" },
  { label: translations["Th"][language], value: "thursday", apiName: "Thursday" },
  { label: translations["Fr"][language], value: "friday", apiName: "Friday" },
  { label: translations["Sa"][language], value: "saturday", apiName: "Saturday" },
  { label: translations["Su"][language], value: "sunday", apiName: "Sunday" },
];

const ModalIntervals = ({
  opened,
  onClose,
  schedule,
  selected,
  fetchData,
  selectedTechnicians = [],
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [intervalsByDay, setIntervalsByDay] = useState({});

  const toggleDay = (day) => {
    const updated = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setSelectedDays(updated);
  };

  useEffect(() => {
    if (!opened || selected.employeeIndex === null) return;

    const selectedEmployee = schedule[selected.employeeIndex];
    const selectedShifts = selectedEmployee?.shifts || [];

    const updatedIntervals = {};

    DAYS.forEach((day, idx) => {
      if (selectedDays.includes(day.value)) {
        updatedIntervals[day.value] = selectedShifts[idx] || [];
      }
    });

    setIntervalsByDay(updatedIntervals);
  }, [opened, selected, selectedDays, schedule]);

  const getTechnicianIds = () =>
    selectedTechnicians.length > 0
      ? selectedTechnicians
      : [schedule[selected.employeeIndex]?.id];

  const getWeekdays = () =>
    DAYS.filter((d) => selectedDays.includes(d.value)).map((d) => d.apiName);

  const handleRequest = async (apiMethod, payload) => {
    try {
      await apiMethod(payload);
      setStartTime("");
      setEndTime("");
      fetchData();
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" });
    }
  };

  const addInterval = () => handleRequest(api.schedules.addTimeframe, {
    technician_ids: getTechnicianIds(),
    weekdays: getWeekdays(),
    start: startTime,
    end: endTime,
  });

  const cutInterval = () => handleRequest(api.schedules.removeTimeframe, {
    technician_ids: getTechnicianIds(),
    weekdays: getWeekdays(),
    start: startTime,
    end: endTime,
  });

  const deleteByDays = () => handleRequest(api.schedules.deleteWeekdays, {
    technician_ids: getTechnicianIds(),
    weekdays: getWeekdays(),
  });

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

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={getSelectedNames()}
      position="right"
      size="lg"
      padding="xl"
    >
      <form onSubmit={(e) => e.preventDefault()}>
        <Stack>
          <Group spacing="xs" mt="xs">
            <Button
              size="xs"
              variant={selectedDays.length === DAYS.length ? "filled" : "light"}
              onClick={() => {
                setSelectedDays(
                  selectedDays.length === DAYS.length
                    ? []
                    : DAYS.map((d) => d.value)
                );
              }}
              style={{ width: 65 }}
            >
              {translations["Toate"][language]}
            </Button>

            {DAYS.map((day) => (
              <Button
                key={day.value}
                size="xs"
                variant={selectedDays.includes(day.value) ? "filled" : "default"}
                onClick={() => toggleDay(day.value)}
                style={{ width: 54 }}
              >
                {day.label}
              </Button>
            ))}

            <Group align="flex-end" mt="md">
              <TextInput
                type="time"
                label={translations["Start"][language]}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />

              <TextInput
                type="time"
                label={translations["End"][language]}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />

              <ActionIcon
                variant="light"
                color="green"
                onClick={addInterval}
                disabled={!startTime || !endTime}
              >
                <FaPlus />
              </ActionIcon>

              <ActionIcon
                variant="light"
                color="yellow"
                onClick={cutInterval}
                disabled={!startTime || !endTime}
              >
                <FaMinus />
              </ActionIcon>

              <ActionIcon
                variant="light"
                color="red"
                onClick={deleteByDays}
                disabled={!startTime || !endTime}
              >
                <FaTrash />
              </ActionIcon>
            </Group>
          </Group>

          {selectedTechnicians.length <= 1 && selected.employeeIndex !== null &&
            Object.entries(intervalsByDay).map(([dayKey, intervals]) => {
              const dayLabel = DAYS.find(d => d.value === dayKey)?.label;
              return (
                <Stack key={dayKey} mt="md">
                  <Text fw={600}>{dayLabel}</Text>
                  {intervals.map((interval, index) => (
                    <Group key={index} align="flex-end">
                      <TextInput
                        type="time"
                        label={translations["Start"][language]}
                        value={interval.start}
                        onChange={(e) => {
                          const updated = [...intervals];
                          updated[index].start = e.target.value;
                          setIntervalsByDay({ ...intervalsByDay, [dayKey]: updated });
                        }}
                      />
                      <TextInput
                        type="time"
                        label={translations["End"][language]}
                        value={interval.end}
                        onChange={(e) => {
                          const updated = [...intervals];
                          updated[index].end = e.target.value;
                          setIntervalsByDay({ ...intervalsByDay, [dayKey]: updated });
                        }}
                      />
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => {
                          const updated = intervals.filter((_, i) => i !== index);
                          setIntervalsByDay({ ...intervalsByDay, [dayKey]: updated });
                        }}
                      >
                        <FaTrash />
                      </ActionIcon>
                    </Group>
                  ))}
                </Stack>
              );
            })}

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
