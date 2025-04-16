import { useEffect, useState } from "react";
import {
    Button,
    Popover,
    Flex,
    Stack,
    TextInput,
    Text,
} from "@mantine/core";
import { DatePicker, TimeInput } from "@mantine/dates";
import dayjs from "dayjs";
import { parseDate, formatDate } from "../utils";

const quickOptions = [
    { label: "In 15 minutes", getDate: () => dayjs().add(15, "minute") },
    { label: "In 30 minutes", getDate: () => dayjs().add(30, "minute") },
    { label: "In an hour", getDate: () => dayjs().add(1, "hour") },
    { label: "Today", getDate: () => dayjs() },
    { label: "Tomorrow", getDate: () => dayjs().add(1, "day") },
    { label: "This week", getDate: () => dayjs().endOf("week") },
    { label: "In 7 days", getDate: () => dayjs().add(7, "day") },
    { label: "In 30 days", getDate: () => dayjs().add(30, "day") },
    { label: "In 1 year", getDate: () => dayjs().add(1, "year") },
];

const DateQuickInput = ({ value, onChange }) => {
    const [opened, setOpened] = useState(false);
    const [dateInput, setDateInput] = useState("");
    const [timeInput, setTimeInput] = useState("");
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!initialized && value) {
            const initial = dayjs(value);
            setDateInput(initial.format("DD.MM.YYYY"));
            setTimeInput(initial.format("HH:mm"));
            setInitialized(true);
        }
    }, [value, initialized]);

    useEffect(() => {
        if (!dateInput || !timeInput) return;

        const normalizedDateStr = `${dateInput.replace(/\./g, "-")} ${timeInput}:00`;
        const parsed = parseDate(normalizedDateStr);
        if (parsed && onChange) {
            onChange(parsed);
        }
    }, [dateInput, timeInput]);

    const parsedCurrent = parseDate(`${dateInput.replace(/\./g, "-")} ${timeInput}:00`);
    const formatted = parsedCurrent ? formatDate(parsedCurrent) : "";

    return (
        <Popover opened={opened} onChange={setOpened} position="bottom-start" shadow="md">
            <Popover.Target>
                <TextInput
                    value={formatted}
                    onClick={() => setOpened(true)}
                    readOnly
                    label="Deadline"
                />
            </Popover.Target>

            <Popover.Dropdown>
                <Flex gap="md" align="flex-start">
                    <Stack gap="xs" w={180}>
                        {quickOptions.map((option) => {
                            const d = option.getDate();
                            return (
                                <Button
                                    key={option.label}
                                    fullWidth
                                    variant="subtle"
                                    color="gray"
                                    onClick={() => {
                                        setDateInput(d.format("DD.MM.YYYY"));
                                        setTimeInput(d.format("HH:mm"));
                                        setOpened(false);
                                    }}
                                    style={{ justifyContent: "flex-start" }}
                                >
                                    {option.label}
                                </Button>
                            );
                        })}
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
