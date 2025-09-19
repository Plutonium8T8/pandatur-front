import { useContext, useState, useEffect, useMemo, useRef } from "react";
import { Group, Button, Flex, MultiSelect, Select, Modal } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { translations, showServerError } from "../../utils";
import { TypeTask } from "../OptionsTaskType";
import { useGetTechniciansList, useUser } from "../../../hooks";
import dayjs from "dayjs";
import { api } from "../../../api";
import { useSnackbar } from "notistack";
import { SelectWorkflow } from "../../SelectWorkflow";
import { groupTitleOptions } from "../../../FormOptions";
import { convertRolesToMatrix, safeParseJson } from "../../UsersComponent/rolesUtils";
import { AppContext } from "../../../contexts/AppContext";
import { formatMultiSelectData } from "../../utils/multiSelectUtils";
import { UserGroupMultiSelect } from "../../ChatComponent/components/UserGroupMultiSelect/UserGroupMultiSelect";

const language = localStorage.getItem("language") || "RO";

const taskTypeOptions = TypeTask.map((task) => ({
  value: task.name,
  label: task.name,
}));

const TaskFilterModal = ({ opened, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = useState({});
  const { technicians, loading: loadingTechnicians } = useGetTechniciansList();
  const { userId, user, teamUserIds } = useUser();
  const [groupOptions, setGroupOptions] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const rolesMatrix = convertRolesToMatrix(safeParseJson(user?.roles || "[]"));
  const taskViewLevel = rolesMatrix["TASK_VIEW"];
  const isIfResponsible = taskViewLevel === "IfResponsible";
  const isTeam = taskViewLevel === "Team";
  const isAllowed = taskViewLevel === "Allowed";
  const teamTechnicians = technicians.filter((tech) =>
    teamUserIds.has(String(tech.value)) || tech.value === String(userId)
  );

  // Ref для отслеживания предыдущих значений, чтобы избежать бесконечных циклов
  const prevCreatedForRef = useRef(null);

  const { workflowOptions, accessibleGroupTitles } = useContext(AppContext);

  const allowedGroupTitleOptions = groupTitleOptions.filter((g) =>
    accessibleGroupTitles.includes(g.value)
  );

  useEffect(() => {
    if (opened) {
      const defaultFilters = {
        ...filters,
        created_for:
          isAllowed || filters.created_for?.length
            ? filters.created_for
            : [String(userId)],
        status: filters.status === undefined ? false : filters.status,
        group_titles: filters.group_titles || [],
      };
      setLocalFilters(defaultFilters);
      // Убираем onApply отсюда - он будет вызываться только при Apply/Clear
    }
  }, [opened, filters, isAllowed, userId]);

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
  }, [enqueueSnackbar]);

  const handleChange = (field, value) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    const defaultFilters = {
      created_for: [String(userId)],
      status: false,
      group_titles: [],
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

  useEffect(() => {
    if (isTeam) {
      const validIds = new Set(teamTechnicians.map(t => t.value));
      const selected = localFilters.created_for || [];
      const currentCreatedFor = JSON.stringify(selected);

      // Проверяем, изменились ли значения с последнего раза
      if (prevCreatedForRef.current === currentCreatedFor) {
        return; // Ничего не изменилось, выходим
      }

      const filtered = selected.filter((id) => validIds.has(id));

      // Предотвращаем бесконечный цикл: проверяем, нужно ли обновление
      if (filtered.length === 0 && selected.length > 0) {
        // Если нет валидных ID, но есть выбранные - сбрасываем на userId
        const newValue = [String(userId)];
        setLocalFilters(prev => ({ ...prev, created_for: newValue }));
        prevCreatedForRef.current = JSON.stringify(newValue);
      } else if (filtered.length !== selected.length && filtered.length > 0) {
        // Если количество изменилось - обновляем на отфильтрованные
        setLocalFilters(prev => ({ ...prev, created_for: filtered }));
        prevCreatedForRef.current = JSON.stringify(filtered);
      } else {
        // Обновляем ref даже если не меняем значение
        prevCreatedForRef.current = currentCreatedFor;
      }
    }
  }, [isTeam, localFilters.created_for, teamTechnicians, userId]);

  const formattedTechnicians = useMemo(() => formatMultiSelectData(technicians), [technicians]);

  const handleCreatedForChange = (val) => {
    // UserGroupMultiSelect уже обрабатывает логику групп внутри себя
    // Просто передаем выбранные значения, но проверяем изменения для оптимизации
    const current = localFilters.created_for || [];

    // Обновляем только если значения действительно изменились
    if (val.length !== current.length || !val.every(id => current.includes(id))) {
      handleChange("created_for", val);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={translations["Filtru"][language]}
      withCloseButton
      centered
      size="xl"
      styles={{
        content: {
          display: "flex",
          flexDirection: "column",
        },
        body: {
          flex: 1,
          overflowY: "auto",
        },
      }}
    >
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

        <UserGroupMultiSelect
          label={translations["Responsabil"][language]}
          techniciansData={formattedTechnicians}
          value={
            isIfResponsible
              ? [String(userId)]
              : localFilters.created_for || []
          }
          onChange={handleCreatedForChange}
          placeholder={translations["Responsabil"][language]}
          mode="multi"
          // Добавляем фильтрацию по ролям
          allowedUserIds={
            isTeam
              ? new Set([...teamUserIds, String(userId)])
              : isIfResponsible
                ? new Set([String(userId)])
                : null
          }
          disabled={loadingTechnicians || isIfResponsible}
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
          data={allowedGroupTitleOptions}
          value={localFilters.group_titles?.length ? localFilters.group_titles : accessibleGroupTitles}
          onChange={(val) =>
            handleChange(
              "group_titles",
              val.length > 0 ? val : accessibleGroupTitles
            )
          }
          clearable={false}
          searchable
          disabled={accessibleGroupTitles.length === 1}
        />

        <SelectWorkflow
          selectedValues={localFilters.workflows || []}
          onChange={(val) => handleChange("workflows", val)}
          options={workflowOptions}
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

      <Group mt="md" justify="flex-end">
        <Button variant="outline" onClick={handleClear}>
          {translations["Reset filtru"][language]}
        </Button>
        <Button onClick={handleApply}>
          {translations["Aplică"][language]}
        </Button>
      </Group>
    </Modal>
  );
};

export default TaskFilterModal;
