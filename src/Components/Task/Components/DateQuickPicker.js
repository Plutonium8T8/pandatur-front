import { useEffect, useMemo, useState } from "react";
import { Button, Popover, Flex, Stack, TextInput } from "@mantine/core";
import { DatePicker, TimeInput } from "@mantine/dates";
import dayjs from "dayjs";
import { applyOffset, quickOptions, translations } from "../../utils";
import { YYYY_MM_DD, HH_mm } from "../../../app-constants";

const language = localStorage.getItem("language") || "RO";

const coerceToDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val === "number") {
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    }
    if (typeof val === "string") {
        const s = val.trim().replace(" ", "T").replace(/Z$/, "");
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
};

const buildDate = (dateStr, timeStr) => {
    if (!dateStr) return null;
    const ds = dateStr.replace(/\./g, "-");
    const [y, m, d] = ds.split("-").map((x) => Number(x));
    const [hh, mm] = (timeStr || "00:00").split(":").map((x) => Number(x));
    if (!y || !m || !d) return null;
    const dt = new Date(y, m - 1, d, hh || 0, mm || 0, 0);
    return isNaN(dt.getTime()) ? null : dt;
};

const DateQuickInput = ({ value, onChange, disabled = false }) => {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");

    useEffect(() => {
        const d = coerceToDate(value);
        if (d) {
            const dj = dayjs(d);
            setDate(dj.format(YYYY_MM_DD));
            setTime(dj.format(HH_mm));
        } else {
            setDate("");
            setTime("");
        }
    }, [value]);

    const composed = useMemo(() => buildDate(date, time), [date, time]);
    const display = composed ? dayjs(composed).format("YYYY-MM-DD HH:mm:ss") : "";

    useEffect(() => {
        if (!disabled && composed && onChange) onChange(composed);
    }, [composed, disabled, onChange]);

    const handleQuickSelect = (option) => {
        if (disabled) return;
        const base = composed && dayjs(composed).isAfter(dayjs()) ? dayjs(composed) : dayjs();
        const result = option.custom ? option.custom() : applyOffset(base, option.offset);
        setDate(result.format(YYYY_MM_DD));
        setTime(result.format(HH_mm));
    };

    return (
        <Popover
            opened={popoverOpen}
            onChange={setPopoverOpen}
            position="bottom-start"
            shadow="md"
            disabled={disabled}
        >
            <Popover.Target>
                <TextInput
                    value={display}
                    readOnly
                    onClick={() => !disabled && setPopoverOpen(true)}
                    label={translations["Deadline"][language]}
                    placeholder={translations["Deadline"][language]}
                    disabled={disabled}
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
                                onClick={() => handleQuickSelect(option)}
                                style={{ justifyContent: "flex-start" }}
                                disabled={disabled}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </Stack>

                    <Stack gap="xs">
                        <TextInput
                            label={translations["Date"][language]}
                            value={date}
                            onChange={(e) => setDate(e.currentTarget.value)}
                            placeholder="yyyy-mm-dd / dd.mm.yyyy"
                            disabled={disabled}
                        />
                        <TimeInput
                            label={translations["Hour"][language]}
                            value={time}
                            onChange={(e) => setTime(e.currentTarget.value)}
                            disabled={disabled}
                        />
                        <DatePicker
                            value={composed ?? null}
                            onChange={(d) => d && setDate(dayjs(d).format(YYYY_MM_DD))}
                            size="md"
                            minDate={new Date()}
                            disabled={disabled}
                        />
                    </Stack>
                </Flex>
            </Popover.Dropdown>
        </Popover>
    );
};

export default DateQuickInput;
