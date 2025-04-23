import { useState, useEffect } from "react";
import {
    Group,
    Button,
    Box,
    Flex,
    MultiSelect,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { translations } from "../utils/translations";
import { MantineModal } from "../MantineModal";
import { TypeTask } from "./OptionsTaskType";
import { useGetTechniciansList } from "../../hooks/useGetTechniciansList";
import { useUser } from "../../hooks";
import dayjs from "dayjs";

const language = localStorage.getItem("language") || "RO";

const taskTypeOptions = TypeTask.map((task) => ({
    value: task.name,
    label: task.name,
}));

const TaskFilterModal = ({ opened, onClose, filters, onApply }) => {
    const [localFilters, setLocalFilters] = useState({});
    const { technicians, loading: loadingTechnicians } = useGetTechniciansList();
    const { userId } = useUser();

    useEffect(() => {
        if (!filters.created_for || filters.created_for.length === 0) {
            const defaultFilters = { ...filters, created_for: [String(userId)] };
            setLocalFilters(defaultFilters);
            onApply(defaultFilters);
        } else {
            setLocalFilters(filters);
        }
    }, [userId]);

    const handleChange = (field, value) => {
        setLocalFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleClear = () => {
        const cleared = { created_for: [String(userId)] };
        setLocalFilters(cleared);
        onApply(cleared);
    };

    const cleanFilters = (filters) => {
        return Object.fromEntries(
            Object.entries(filters).filter(
                ([_, value]) => !(Array.isArray(value) && value.length === 0) && value !== null
            )
        );
    };

    const handleApply = () => {
        onApply(cleanFilters(localFilters));
        onClose();
    };

    return (
        <MantineModal
            open={opened}
            onClose={onClose}
            title={translations["Filtru"][language]}
            height="auto"
        >
            <Box p="sm" mt="md">
                <Flex gap="sm" direction="column">
                    <MultiSelect
                        label={translations["Tipul Taskului"][language]}
                        data={taskTypeOptions}
                        value={localFilters.task_type || []}
                        onChange={(val) => handleChange("task_type", val)}
                        placeholder={translations["Tipul Taskului"][language]}
                        clearable
                        searchable
                    />

                    <MultiSelect
                        label={translations["Autor"][language]}
                        data={technicians}
                        value={localFilters.created_by || []}
                        onChange={(val) => handleChange("created_by", val)}
                        placeholder={translations["Autor"][language]}
                        clearable
                        searchable
                        nothingFoundMessage={translations["noResult"][language]}
                        disabled={loadingTechnicians}
                    />

                    <MultiSelect
                        label={translations["Responsabil"][language]}
                        data={technicians}
                        value={localFilters.created_for || []}
                        onChange={(val) => handleChange("created_for", val)}
                        placeholder={translations["Responsabil"][language]}
                        clearable
                        searchable
                        nothingFoundMessage={translations["noResult"][language]}
                        disabled={loadingTechnicians}
                    />

                    <DatePickerInput
                        type="range"
                        label={translations["intervalDate"][language]}
                        value={
                            localFilters.date_from && localFilters.date_to
                                ? [new Date(localFilters.date_from), new Date(localFilters.date_to)]
                                : [null, null]
                        }
                        onChange={(range) => {
                            handleChange("date_from", range?.[0] ? dayjs(range[0]).format("YYYY-MM-DD") : null);
                            handleChange("date_to", range?.[1] ? dayjs(range[1]).format("YYYY-MM-DD") : null);
                        }}
                        clearable
                    />

                </Flex>

                <Group mt="xl" justify="flex-end">
                    <Button variant="outline" onClick={handleClear}>
                        {translations["Reset filtru"][language] || "Curăță"}
                    </Button>
                    <Button onClick={handleApply}>
                        {translations["Aplică"][language]}
                    </Button>
                </Group>
            </Box>
        </MantineModal>
    );
};

export default TaskFilterModal;
