import { useState, useEffect } from "react";
import {
    Group,
    Button,
    Box,
    Flex,
    MultiSelect,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { translations } from "../../utils/translations";
import { MantineModal } from "../../MantineModal";
import { TypeTask } from "../OptionsTaskType";
import { useGetTechniciansList } from "../../../hooks/useGetTechniciansList";
import { useUser } from "../../../hooks";
import dayjs from "dayjs";
import { api } from "../../../api";

const language = localStorage.getItem("language") || "RO";

const taskTypeOptions = TypeTask.map((task) => ({
    value: task.name,
    label: task.name,
}));

const TaskFilterModal = ({ opened, onClose, filters, onApply }) => {
    const [localFilters, setLocalFilters] = useState({});
    const { technicians, loading: loadingTechnicians } = useGetTechniciansList();
    const { userId } = useUser();
    const [groupOptions, setGroupOptions] = useState([]);

    useEffect(() => {
        if (!filters.created_for || filters.created_for.length === 0) {
            const defaultFilters = { ...filters, created_for: [String(userId)] };
            setLocalFilters(defaultFilters);
            onApply(defaultFilters);
        } else {
            setLocalFilters(filters);
        }
    }, [userId]);

    useEffect(() => {
        const fetchGroups = async () => {
            const data = await api.user.getGroupsList();
            const options = data.map((group) => ({
                value: group.name,
                label: group.name,
            }));
            setGroupOptions(options);
        };
        fetchGroups();
    }, []);

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
                ([_, value]) =>
                    !(Array.isArray(value) && value.length === 0) &&
                    value !== null &&
                    value !== ""
            )
        );
    };

    const handleApply = () => {
        const cleaned = cleanFilters(localFilters);
        if (cleaned.user_group_names && typeof cleaned.user_group_names === "string") {
            cleaned.user_group_names = [cleaned.user_group_names];
        }
        onApply(cleaned);
        onClose();
    };

    const getDateRangeValue = (dateFrom, dateTo) => {
        if (dateFrom && dateTo) {
            return [
                dayjs(dateFrom, "DD-MM-YYYY").toDate(),
                dayjs(dateTo, "DD-MM-YYYY").toDate(),
            ];
        }
        return undefined;
    };

    const handleDateRangeChange = (range) => {
        handleChange("date_from", range?.[0] ? dayjs(range[0]).format("DD-MM-YYYY") : null);
        handleChange("date_to", range?.[1] ? dayjs(range[1]).format("DD-MM-YYYY") : null);
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

                    <MultiSelect
                        label={translations["Alege grupul"][language]}
                        placeholder={translations["Alege grupul"][language]}
                        data={groupOptions}
                        value={localFilters.user_group_names || []}
                        onChange={(val) => handleChange("user_group_names", val)}
                        clearable
                        searchable
                        nothingFoundMessage={translations["noResult"][language]}
                    />

                    <DatePickerInput
                        type="range"
                        label={translations["intervalDate"][language]}
                        value={getDateRangeValue(localFilters.date_from, localFilters.date_to)}
                        onChange={handleDateRangeChange}
                        clearable
                        valueFormat="DD-MM-YYYY"
                        placeholder={translations["intervalDate"][language]}
                    />
                </Flex>

                <Group mt="xl" justify="flex-end">
                    <Button variant="outline" onClick={handleClear}>
                        {translations["Reset filtru"][language]}
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
