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
    }, [filters, userId]);

    const handleChange = (field, value) => {
        setLocalFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleClear = () => {
        const cleared = {};
        setLocalFilters(cleared);
        onApply(cleared);
    };

    const handleApply = () => {
        onApply(localFilters);
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
                        placeholder="Alege autorii"
                        clearable
                        searchable
                        nothingFoundMessage="Niciun rezultat"
                        disabled={loadingTechnicians}
                    />

                    <MultiSelect
                        label={translations["Responsabil"][language]}
                        data={technicians}
                        value={localFilters.created_for || []}
                        onChange={(val) => handleChange("created_for", val)}
                        placeholder="Alege responsabili"
                        clearable
                        searchable
                        nothingFoundMessage="Niciun rezultat"
                        disabled={loadingTechnicians}
                    />

                    <DatePickerInput
                        label="De la"
                        value={localFilters.date_from || null}
                        onChange={(val) =>
                            handleChange("date_from", val ? val.toISOString().split("T")[0] : null)
                        }
                        clearable
                    />

                    <DatePickerInput
                        label="Până la"
                        value={localFilters.date_to || null}
                        onChange={(val) =>
                            handleChange("date_to", val ? val.toISOString().split("T")[0] : null)
                        }
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
