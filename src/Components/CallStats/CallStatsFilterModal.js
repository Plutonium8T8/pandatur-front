import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Flex, MultiSelect, Select, TextInput, Group } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import { Spin } from "@components";
import { getLanguageByKey } from "../utils";
import { formatMultiSelectData, getGroupUserMap } from "../utils/multiSelectUtils";

export const CallStatsFilterModal = ({
    opened,
    onClose,
    onApply,
    initialFilters = {},
    technicians = [],
    mode = "stats",
    loading = false,
}) => {
    const formattedTechs = useMemo(() => formatMultiSelectData(technicians), [technicians]);
    const groupUserMap = useMemo(() => getGroupUserMap(formattedTechs), [formattedTechs]);

    const [selectedTechnicians, setSelectedTechnicians] = useState(initialFilters.user_id || []);
    const [status, setStatus] = useState(initialFilters.status || "");
    const [dateFrom, setDateFrom] = useState(initialFilters.date_from || null);
    const [dateTo, setDateTo] = useState(initialFilters.date_to || null);
    const [searchPhone, setSearchPhone] = useState(initialFilters.search || "");

    useEffect(() => {
        setSelectedTechnicians(initialFilters.user_id || []);
        setStatus(initialFilters.status || "");
        setDateFrom(initialFilters.date_from || null);
        setDateTo(initialFilters.date_to || null);
        setSearchPhone(initialFilters.search || "");
    }, [opened, initialFilters]);

    const handleTechniciansChange = (val) => {
        const last = val[val.length - 1];
        if (last?.startsWith("__group__")) {
            const groupUsers = groupUserMap.get(last) || [];
            const unique = Array.from(new Set([...selectedTechnicians, ...groupUsers]));
            setSelectedTechnicians(unique);
        } else {
            setSelectedTechnicians(val.filter((v) => !v.startsWith("__group__")));
        }
    };

    const filteredValues = useMemo(
        () => selectedTechnicians.filter(
            v => formattedTechs.some(t => t.value === v && !t.value.startsWith("__group__"))
        ),
        [selectedTechnicians, formattedTechs]
    );

    const handleApply = () => {
        const filters = {};
        if (filteredValues.length) filters.user_id = filteredValues;
        if (mode === "calls" && searchPhone.trim()) filters.search = searchPhone.trim();
        if (mode === "calls" && status) filters.status = status;

        if (dateFrom || dateTo) {
            filters.timestamp = {};
            if (dateFrom) filters.timestamp.from = dayjs(dateFrom).format("DD-MM-YYYY");
            if (dateTo) filters.timestamp.until = dayjs(dateTo).format("DD-MM-YYYY");
        }

        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        setSelectedTechnicians([]);
        setStatus("");
        setDateFrom(null);
        setDateTo(null);
        setSearchPhone("");
        onApply({});
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={getLanguageByKey("FilterCalls")}
            centered
            withCloseButton
            size="lg"
            styles={{
                content: {
                    minHeight: 400,
                    height: 600,
                    display: "flex",
                    flexDirection: "column",
                },
                body: {
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    paddingBottom: 0,
                },
            }}
        >
            <Flex direction="column" style={{ flex: 1, height: "100%" }}>
                {loading ? (
                    <Flex align="center" justify="center" style={{ minHeight: 150 }}>
                        <Spin />
                    </Flex>
                ) : (
                    <Flex direction="column" gap={16} style={{ flex: 1 }}>
                        <MultiSelect
                            label={getLanguageByKey("Users")}
                            data={formattedTechs}
                            value={filteredValues}
                            onChange={handleTechniciansChange}
                            placeholder={getLanguageByKey("SelectTechnicians")}
                            searchable
                            clearable
                        />

                        {mode === "calls" && (
                            <>
                                <Select
                                    label={getLanguageByKey("Status")}
                                    data={[
                                        { value: "ANSWER", label: getLanguageByKey("Answered") },
                                        { value: "NOANSWER", label: getLanguageByKey("NoAnswer") }
                                    ]}
                                    value={["ANSWER", "NOANSWER"].includes(status) ? status : ""}
                                    onChange={(val) => setStatus(val || "")}
                                    clearable
                                    searchable={false}
                                    placeholder={getLanguageByKey("SelectStatus")}
                                />
                            </>
                        )}

                        <Flex gap={12}>
                            <DatePickerInput
                                label={getLanguageByKey("DateFrom")}
                                value={dateFrom}
                                onChange={setDateFrom}
                                placeholder="dd.mm.yyyy"
                                style={{ flex: 1 }}
                            />
                            <DatePickerInput
                                label={getLanguageByKey("DateTo")}
                                value={dateTo}
                                onChange={setDateTo}
                                placeholder="dd.mm.yyyy"
                                style={{ flex: 1 }}
                            />
                        </Flex>
                    </Flex>
                )}
                <Group mt="auto" pt={16} pb={16} justify="flex-end">
                    <Button variant="outline" onClick={handleReset}>
                        {getLanguageByKey("Reset")}
                    </Button>
                    <Button onClick={handleApply}>
                        {getLanguageByKey("Apply")}
                    </Button>
                </Group>
            </Flex>
        </Modal>
    );
};
