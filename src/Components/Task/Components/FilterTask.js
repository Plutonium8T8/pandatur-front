import { useState, useEffect } from "react";
import { Group, Button, Box, Flex, MultiSelect, Select } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { translations, showServerError } from "../../utils";
import { MantineModal } from "../../MantineModal";
import { TypeTask } from "../OptionsTaskType";
import { useGetTechniciansList, useUser } from "../../../hooks";
import dayjs from "dayjs";
import { api } from "../../../api";
import { useSnackbar } from "notistack";
import { SelectWorkflow } from "../../SelectWorkflow";
import { groupTitleOptions } from "../../../FormOptions";

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
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const defaultFilters = {
      ...filters,
      created_for: filters.created_for?.length ? filters.created_for : [String(userId)],
      status: filters.status === undefined ? false : filters.status,
    };
    setLocalFilters(defaultFilters);
    onApply(defaultFilters);
  }, [userId]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await api.user.getGroupsList();
        const options = data.map((group) => ({
          value: group.name,
          label: group.name,
        }));
        setGroupOptions(options);
      } catch (error) {
        enqueueSnackbar(showServerError(error), { variant: "error" });
      }
    };
    fetchGroups();
  }, []);

  const handleChange = (field, value) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    const defaultFilters = {
      created_for: [String(userId)],
      status: false,
    };
    setLocalFilters(defaultFilters);
    onApply(defaultFilters);
  };

  const cleanFilters = (filters) => {
    return Object.fromEntries(
      Object.entries(filters).filter(
        ([_, value]) =>
          !(Array.isArray(value) && value.length === 0) &&
          value !== null &&
          value !== "",
      ),
    );
  };

  const handleApply = () => {
    const cleaned = cleanFilters(localFilters);
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
    handleChange(
      "date_from",
      range?.[0] ? dayjs(range[0]).format("DD-MM-YYYY") : null,
    );
    handleChange(
      "date_to",
      range?.[1] ? dayjs(range[1]).format("DD-MM-YYYY") : null,
    );
  };

  return (
    <MantineModal
      open={opened}
      onClose={onClose}
      title={translations["Filtru"][language]}
      height="auto"
    >
      <Box p="sm">
        <Flex gap="sm" direction="column">
          <DatePickerInput
            type="range"
            label={translations["intervalDate"][language]}
            value={getDateRangeValue(
              localFilters.date_from,
              localFilters.date_to,
            )}
            onChange={handleDateRangeChange}
            clearable
            valueFormat="DD-MM-YYYY"
            placeholder={translations["intervalDate"][language]}
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
            label={translations["Tipul Taskului"][language]}
            data={taskTypeOptions}
            value={localFilters.task_type || []}
            onChange={(val) => handleChange("task_type", val)}
            placeholder={translations["Tipul Taskului"][language]}
            clearable
            searchable
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

          <MultiSelect
            label={translations["groupTitle"][language]}
            placeholder={translations["groupTitle"][language]}
            data={groupTitleOptions.map((val) => ({ value: val, label: val }))}
            value={localFilters.group_title || []}
            onChange={(val) => handleChange("group_title", val)}
            clearable
            searchable
          />

          <SelectWorkflow
            selectedValues={localFilters.workflow || []}
            onChange={(val) => handleChange("workflow", val)}
          />

          <Select
            label={translations["Status"][language]}
            placeholder={translations["ChoiseStatus"][language]}
            data={[
              { value: "true", label: translations["done"][language] },
              { value: "false", label: translations["toDo"][language] },
            ]}
            value={
              typeof localFilters.status === "boolean"
                ? String(localFilters.status)
                : localFilters.status || null
            }
            onChange={(val) =>
              handleChange(
                "status",
                val === "true" ? true : val === "false" ? false : null,
              )
            }
            clearable
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
