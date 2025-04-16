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
import {
    parseDate,
    formatDate,
    applyOffset,
    quickOptions,
} from "../utils/date";
import { translations } from "../utils/translations";

const language = localStorage.getItem("language") || "RO";

const DateQuickInput = ({ value, onChange }) => {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [initialized, setInitialized] = useState(false);

    const safeTime = time || "00:00";
    const combined = `${date.replace(/\./g, "-")} ${safeTime}:00`;
    const parsedDate = parseDate(combined);
    const display = parsedDate ? formatDate(parsedDate) : "";

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
                    value={display}
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
                                if (d) setDate(dayjs(d).format("DD.MM.YYYY"));
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
