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

const applyTimeOffset = (baseDate, offset = {}) => {
    let result = baseDate;
    if (offset.minutes) result = result.add(offset.minutes, "minute");
    if (offset.hours) result = result.add(offset.hours, "hour");
    if (offset.days) result = result.add(offset.days, "day");
    if (offset.years) result = result.add(offset.years, "year");
    return result;
};

const quickTimeOptions = [
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
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [dateString, setDateString] = useState("");
    const [timeString, setTimeString] = useState("");
    const [isInitialized, setIsInitialized] = useState(false);

    const fallbackTime = timeString || "00:00";
    const currentParsedDate = parseDate(`${dateString.replace(/\./g, "-")} ${fallbackTime}:00`);
    const displayValue = currentParsedDate ? formatDate(currentParsedDate) : "";

    useEffect(() => {
        if (!isInitialized && value) {
            const initialDate = dayjs(value);
            setDateString(initialDate.format("DD.MM.YYYY"));
            setTimeString(initialDate.format("HH:mm"));
            setIsInitialized(true);
        }
    }, [value, isInitialized]);

    useEffect(() => {
        if (!dateString) return;
        const dateToParse = `${dateString.replace(/\./g, "-")} ${fallbackTime}:00`;
        const parsed = parseDate(dateToParse);
        if (parsed && onChange) {
            onChange(parsed);
        }
    }, [dateString, timeString]);

    const handleQuickOptionClick = (option) => {
        const now = dayjs();
        const isFuture = currentParsedDate && dayjs(currentParsedDate).isAfter(now);
        const baseDate = isFuture ? dayjs(currentParsedDate) : now;

        const resultDate = option.custom
            ? option.custom()
            : applyTimeOffset(baseDate, option.offset);

        setDateString(resultDate.format("DD.MM.YYYY"));
        setTimeString(resultDate.format("HH:mm"));
    };

    return (
        <Popover opened={isPopoverOpen} onChange={setIsPopoverOpen} position="bottom-start" shadow="md">
            <Popover.Target>
                <TextInput
                    value={displayValue}
                    readOnly
                    onClick={() => setIsPopoverOpen(true)}
                    label={translations["Deadline"][language]}
                    placeholder={translations["Deadline"][language]}
                />
            </Popover.Target>

            <Popover.Dropdown>
                <Flex gap="md" align="flex-start">
                    <Stack gap="xs" w={180}>
                        {quickTimeOptions.map((option) => (
                            <Button
                                key={option.label}
                                fullWidth
                                variant="subtle"
                                color="gray"
                                onClick={() => handleQuickOptionClick(option)}
                                style={{ justifyContent: "flex-start" }}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </Stack>

                    <Stack gap="xs">
                        <TextInput
                            label="Data"
                            value={dateString}
                            onChange={(e) => setDateString(e.currentTarget.value)}
                            placeholder="dd.mm.yyyy"
                        />
                        <TimeInput
                            label="Ora"
                            value={timeString}
                            onChange={(e) => setTimeString(e.currentTarget.value)}
                        />
                        <DatePicker
                            value={currentParsedDate || new Date()}
                            onChange={(date) => {
                                if (date) {
                                    setDateString(dayjs(date).format("DD.MM.YYYY"));
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
