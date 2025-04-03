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
  const selectedEmployee = schedule[selected.employeeIndex];
  const selectedShifts = selectedEmployee?.shifts || [];

  const isAddOrCutDisabled = !startTime || !endTime || selectedDays.length === 0;
  const isDeleteDisabled = selectedDays.length === 0;

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  useEffect(() => {
    if (!opened || selected.employeeIndex === null) return;

    if (selected.dayIndex !== null) {
      const defaultDay = DAYS[selected.dayIndex]?.value;
      if (defaultDay && !selectedDays.includes(defaultDay)) {
        setSelectedDays([defaultDay]);
      }
    }
  }, [opened, selected]);

  useEffect(() => {
    if (!opened || selected.employeeIndex === null) return;

    const updated = {};
    selectedDays.forEach((day) => {
      const index = DAYS.findIndex((d) => d.value === day);
      updated[day] = selectedShifts[index] || [];
    });
    setIntervalsByDay(updated);
  }, [selectedDays, opened, selected.employeeIndex]);

  const getTechnicianIds = () =>
    selectedTechnicians.length > 0
      ? selectedTechnicians
      : [selectedEmployee?.id];

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

  const addInterval = () =>
    handleRequest(api.schedules.addTimeframe, {
      technician_ids: getTechnicianIds(),
      weekdays: getWeekdays(),
      start: startTime,
      end: endTime,
    });

  const cutInterval = () =>
    handleRequest(api.schedules.removeTimeframe, {
      technician_ids: getTechnicianIds(),
      weekdays: getWeekdays(),
      start: startTime,
      end: endTime,
    });

  const deleteByDays = () =>
    handleRequest(api.schedules.deleteWeekdays, {
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

    return selectedEmployee
      ? `${selectedEmployee.name} (${selectedEmployee.id})`
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
              onClick={() =>
                setSelectedDays(
                  selectedDays.length === DAYS.length
                    ? []
                    : DAYS.map((d) => d.value)
                )
              }
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
                disabled={isAddOrCutDisabled}
              >
                <FaPlus />
              </ActionIcon>

              <ActionIcon
                variant="light"
                color="yellow"
                onClick={cutInterval}
                disabled={isAddOrCutDisabled}
              >
                <FaMinus />
              </ActionIcon>

              <ActionIcon
                variant="light"
                color="red"
                onClick={deleteByDays}
                disabled={isDeleteDisabled}
              >
                <FaTrash />
              </ActionIcon>
            </Group>
          </Group>

          {selectedTechnicians.length <= 1 &&
            selectedEmployee &&
            Object.entries(intervalsByDay).map(([dayKey, intervals]) => {
              const dayLabel = DAYS.find((d) => d.value === dayKey)?.label;
              return (
                <Stack key={dayKey} mt="md">
                  <Text fw={600}>{dayLabel}</Text>
                  {intervals.length > 0 ? (
                    intervals.map((interval, index) => (
                      <Group key={index} align="flex-end">
                        <TextInput
                          type="time"
                          label={translations["Start"][language]}
                          value={interval.start}
                          onChange={(e) => {
                            const updated = [...intervals];
                            updated[index].start = e.target.value;
                            setIntervalsByDay({
                              ...intervalsByDay,
                              [dayKey]: updated,
                            });
                          }}
                        />
                        <TextInput
                          type="time"
                          label={translations["End"][language]}
                          value={interval.end}
                          onChange={(e) => {
                            const updated = [...intervals];
                            updated[index].end = e.target.value;
                            setIntervalsByDay({
                              ...intervalsByDay,
                              [dayKey]: updated,
                            });
                          }}
                        />
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={async () => {
                            const weekday = DAYS.find((d) => d.value === dayKey).apiName;

                            try {
                              await api.schedules.removeTimeframe({
                                technician_ids: getTechnicianIds(),
                                weekdays: [weekday],
                                start: interval.start,
                                end: interval.end,
                              });

                              // обновляем локальное состояние
                              const updated = intervals.filter((_, i) => i !== index);
                              setIntervalsByDay((prev) => ({
                                ...prev,
                                [dayKey]: updated,
                              }));

                              fetchData();
                            } catch (e) {
                              enqueueSnackbar(showServerError(e), { variant: "error" });
                            }
                          }}
                        >
                          <FaTrash />
                        </ActionIcon>
                      </Group>
                    ))
                  ) : (
                    <Text size="sm">
                      {translations["Fără intervale"][language]}
                    </Text>
                  )}
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
    </Drawer >
  );
};

export default ModalIntervals;
