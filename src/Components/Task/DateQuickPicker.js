import { useEffect, useState } from "react";
import {
    Button,
    Popover,
    Flex,
    Stack,
    TextInput,
} from "@mantine/core";
import { DatePicker, TimeInput } from "@mantine/dates";
import dayjs from "dayjs";
import { parseDate, formatDate } from "../utils";
import { translations } from "../utils/translations";

const language = localStorage.getItem("language") || "RO";

const applyOffset = (base, offset = {}) => {
    let result = base;
    if (offset.minutes) result = result.add(offset.minutes, "minute");
    if (offset.hours) result = result.add(offset.hours, "hour");
    if (offset.days) result = result.add(offset.days, "day");
    if (offset.years) result = result.add(offset.years, "year");
    return result;
};

const quickOptions = [
    { label: "In 15 minutes", offset: { minutes: 15 } },
    { label: "In 30 minutes", offset: { minutes: 30 } },
    { label: "In an hour", offset: { hours: 1 } },
    { label: "In 1 day", offset: { days: 1 } },
    { label: "In 7 days", offset: { days: 7 } },
    { label: "In 30 days", offset: { days: 30 } },
    { label: "In 1 year", offset: { years: 1 } },
    { label: "Today", custom: () => dayjs() },
    { label: "Tomorrow", custom: () => dayjs().add(1, "day") },
    { label: "This week", custom: () => dayjs().endOf("week") },
];

const DateQuickInput = ({ value, onChange }) => {
    const [opened, setOpened] = useState(false);
    const [dateInput, setDateInput] = useState("");
    const [timeInput, setTimeInput] = useState("");
    const [initialized, setInitialized] = useState(false);

    const time = timeInput || "00:00";
    const parsedCurrent = parseDate(`${dateInput.replace(/\./g, "-")} ${time}:00`);
    const formatted = parsedCurrent ? formatDate(parsedCurrent) : "";

    // init from value
    useEffect(() => {
        if (!initialized && value) {
            const initial = dayjs(value);
            setDateInput(initial.format("DD.MM.YYYY"));
            setTimeInput(initial.format("HH:mm"));
            setInitialized(true);
        }
    }, [value, initialized]);

    // propagate changes
    useEffect(() => {
        if (!dateInput) return;
        const normalized = `${dateInput.replace(/\./g, "-")} ${time}:00`;
        const parsed = parseDate(normalized);
        if (parsed && onChange) {
            onChange(parsed);
        }
    }, [dateInput, timeInput]);

    const handleOptionClick = (option) => {
        let d;
        if (option.custom) {
            d = option.custom();
        } else {
            const now = dayjs();
            const base = parsedCurrent && dayjs(parsedCurrent).isAfter(now)
                ? dayjs(parsedCurrent)
                : now;
            d = applyOffset(base, option.offset);
        }

        setDateInput(d.format("DD.MM.YYYY"));
        setTimeInput(d.format("HH:mm"));
    };

    return (
        <Popover opened={opened} onChange={setOpened} position="bottom-start" shadow="md">
            <Popover.Target>
                <TextInput
                    value={formatted}
                    readOnly
                    onClick={() => setOpened(true)}
                    label={translations["Deadline"][language]}
                    placeholder={translations["Deadline"][language]}
                />
            </Popover.Target>

            <Popover.Dropdown>
                <Flex gap="md" align="flex-start">
                    <Stack gap="xs" w={180}>
                        {quickOptions.map((option) => (
                            <Button
                                key={option.label}
                                fullWidth
                                variant="subtle"
                                color="gray"
                                onClick={() => handleOptionClick(option)}
                                style={{ justifyContent: "flex-start" }}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </Stack>

                    <Stack gap="xs">
                        <TextInput
                            label="Data"
                            value={dateInput}
                            onChange={(e) => setDateInput(e.currentTarget.value)}
                            placeholder="dd.mm.yyyy"
                        />
                        <TimeInput
                            label="Ora"
                            value={timeInput}
                            onChange={(e) => setTimeInput(e.currentTarget.value)}
                        />
                        <DatePicker
                            value={parsedCurrent || new Date()}
                            onChange={(d) => {
                                if (d) setDateInput(dayjs(d).format("DD.MM.YYYY"));
                            }}
                            size="md"
                            minDate={new Date()}
                        />
                    </Stack>
                </Flex>
            </Popover.Dropdown>
        </Popover>
    );
};

export default DateQuickInput;
