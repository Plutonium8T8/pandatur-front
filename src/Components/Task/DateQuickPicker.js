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
    let updated = base;
    if (offset.minutes) updated = updated.add(offset.minutes, "minute");
    if (offset.hours) updated = updated.add(offset.hours, "hour");
    if (offset.days) updated = updated.add(offset.days, "day");
    if (offset.years) updated = updated.add(offset.years, "year");
    return updated;
};

const quickOptions = [
    { label: "In 15 minutes", offset: { minutes: 15 } },
    { label: "In 30 minutes", offset: { minutes: 30 } },
    { label: "In an hour", offset: { hours: 1 } },
    { label: "Today", custom: () => dayjs() },
    { label: "Tomorrow", custom: () => dayjs().add(1, "day") },
    { label: "This week", custom: () => dayjs().endOf("week") },
    { label: "In 7 days", offset: { days: 7 } },
    { label: "In 30 days", offset: { days: 30 } },
    { label: "In 1 year", offset: { years: 1 } },
];

const DateQuickInput = ({ value, onChange }) => {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [initialized, setInitialized] = useState(false);

    const safeTime = time || "00:00";
    const combinedString = `${date.replace(/\./g, "-")} ${safeTime}:00`;
    const parsedDate = parseDate(combinedString);
    const formattedDisplay = parsedDate ? formatDate(parsedDate) : "";

    useEffect(() => {
        if (!initialized && value) {
            const initial = dayjs(value);
            setDate(initial.format("DD.MM.YYYY"));
            setTime(initial.format("HH:mm"));
            setInitialized(true);
        }
    }, [value, initialized]);

    useEffect(() => {
        if (!date) return;
        const parsed = parseDate(`${date.replace(/\./g, "-")} ${safeTime}:00`);
        if (parsed && onChange) {
            onChange(parsed);
        }
    }, [date, time]);

    const handleQuickSelect = (option) => {
        const now = dayjs();
        const isFuture = parsedDate && dayjs(parsedDate).isAfter(now);
        const base = isFuture ? dayjs(parsedDate) : now;

        const result = option.custom ? option.custom() : applyOffset(base, option.offset);
        setDate(result.format("DD.MM.YYYY"));
        setTime(result.format("HH:mm"));
    };

    return (
        <Popover
            opened={popoverOpen}
            onChange={setPopoverOpen}
            position="bottom-start"
            shadow="md"
        >
            <Popover.Target>
                <TextInput
                    value={formattedDisplay}
                    readOnly
                    onClick={() => setPopoverOpen(true)}
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
                                onClick={() => handleQuickSelect(option)}
                                style={{ justifyContent: "flex-start" }}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </Stack>

                    <Stack gap="xs">
                        <TextInput
                            label="Data"
                            value={date}
                            onChange={(e) => setDate(e.currentTarget.value)}
                            placeholder="dd.mm.yyyy"
                        />
                        <TimeInput
                            label="Ora"
                            value={time}
                            onChange={(e) => setTime(e.currentTarget.value)}
                        />
                        <DatePicker
                            value={parsedDate || new Date()}
                            onChange={(d) => {
                                if (d) {
                                    setDate(dayjs(d).format("DD.MM.YYYY"));
                                }
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
