import { useMemo, useEffect, useState } from "react";
import dayjs from "dayjs";
import { Button, Group, MultiSelect, Modal, Stack, Box } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { getLanguageByKey } from "../../utils";
import { YYYY_MM_DD } from "../../../app-constants";
import { useGetTechniciansList } from "../../../hooks";
import { formatMultiSelectData, getGroupUserMap } from "../../utils/multiSelectUtils";
import { user } from "../../../api/user";
import { userGroupsToGroupTitle } from "../../utils/workflowUtils";
import { UserGroupMultiSelect } from "../../ChatComponent/components/UserGroupMultiSelect/UserGroupMultiSelect";
import { groupTitleOptions } from "../../../FormOptions";

const GROUP_PREFIX = "__group__";
const fromGroupKey = (key) => (key?.startsWith(GROUP_PREFIX) ? key.slice(GROUP_PREFIX.length) : key);

const getStartEndDateRange = (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return [startOfDay, endOfDay];
};
const getYesterdayDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getStartEndDateRange(d);
};

export const Filter = ({
  opened,
  onClose,
  onApply, // (payload, meta) => void
  initialTechnicians = [],
  initialUserGroups = [],
  initialGroupTitles = [],
  initialDateRange = [],
  widgetType = "calls", // Тип виджета для определения доступных фильтров
  accessibleGroupTitles = [], // Доступные воронки для текущего пользователя
}) => {
  const { technicians } = useGetTechniciansList();
  const formattedTechnicians = useMemo(() => formatMultiSelectData(technicians), [technicians]);
  const groupUserMap = useMemo(() => getGroupUserMap(technicians), [technicians]);

  const [userGroupsOptions, setUserGroupsOptions] = useState([]);
  const [loadingUserGroups, setLoadingUserGroups] = useState(false);

  const [selectedTechnicians, setSelectedTechnicians] = useState(initialTechnicians);
  const [selectedUserGroups, setSelectedUserGroups] = useState(initialUserGroups);
  const [selectedGroupTitles, setSelectedGroupTitles] = useState(initialGroupTitles);
  const [dateRange, setDateRange] = useState(initialDateRange);

  useEffect(() => {
    if (opened) {
      setSelectedTechnicians(initialTechnicians);
      setSelectedUserGroups(initialUserGroups);
      setSelectedGroupTitles(initialGroupTitles);
      setDateRange(initialDateRange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingUserGroups(true);
        const data = await user.getGroupsList();
        const opts = Array.from(new Set((data || []).map((g) => g?.name).filter(Boolean))).map(
          (name) => ({ value: name, label: name })
        );
        if (mounted) setUserGroupsOptions(opts);
      } catch {
        if (mounted) setUserGroupsOptions([]);
      } finally {
        if (mounted) setLoadingUserGroups(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Фильтруем доступные group titles на основе прав пользователя
  const groupTitleSelectData = useMemo(() => {
    if (accessibleGroupTitles.length === 0) {
      // Если нет доступных воронок, показываем все из статического списка
      return groupTitleOptions;
    }
    
    // Фильтруем статический список по доступным воронкам
    return groupTitleOptions.filter((option) => 
      accessibleGroupTitles.includes(option.value)
    );
  }, [accessibleGroupTitles]);

  // Определяем доступные фильтры в зависимости от типа виджета
  const availableFilters = useMemo(() => {
    const filterMap = {
      'calls': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'messages': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'ticket_state': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'system_usage': ['user_ids', 'user_groups', 'attributes'],
      'ticket_distribution': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'tickets_into_work': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'closed_tickets_count': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'tickets_by_depart_count': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'ticket_lifetime_stats': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'ticket_rate': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'workflow_from_change': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'workflow_to_change': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'ticket_creation': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'workflow_from_de_prelucrat': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'workflow_duration': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'ticket_destination': ['attributes'],
    };

    return filterMap[widgetType] || ['user_ids', 'group_titles', 'user_groups', 'attributes'];
  }, [widgetType]);

  const showUserFilter = availableFilters.includes('user_ids');
  const showGroupTitlesFilter = availableFilters.includes('group_titles');
  const showUserGroupsFilter = availableFilters.includes('user_groups');
  const showDateFilter = availableFilters.includes('attributes');

  const handleUsersChange = (val) => {
    // UserGroupMultiSelect уже обрабатывает группы внутри себя
    // и возвращает только ID пользователей в массиве val
    setSelectedTechnicians(val || []);

    // Определяем группы на основе выбранных пользователей
    const groupsForUsers = new Set();
    for (const [groupKey, users] of groupUserMap.entries()) {
      const hasAny = (val || []).some((u) => users.includes(u));
      if (hasAny) groupsForUsers.add(fromGroupKey(groupKey));
    }
    const nextUserGroups = Array.from(groupsForUsers);
    setSelectedUserGroups(nextUserGroups);

    // Обновляем group titles на основе групп
    const titlesSet = new Set();
    nextUserGroups.forEach((g) => (userGroupsToGroupTitle?.[g] || []).forEach((t) => titlesSet.add(t)));
    setSelectedGroupTitles(Array.from(titlesSet));
  };

  const handleUserGroupsChange = (groups) => {
    setSelectedUserGroups(groups || []);
    const titlesSet = new Set();
    (groups || []).forEach((g) => (userGroupsToGroupTitle?.[g] || []).forEach((t) => titlesSet.add(t)));
    setSelectedGroupTitles(Array.from(titlesSet));
  };


  const isToday =
    dateRange?.[0] && dateRange?.[1] &&
    dayjs(dateRange[0]).isSame(dayjs(), "day") &&
    dayjs(dateRange[1]).isSame(dayjs(), "day");

  const isYesterday =
    dateRange?.[0] && dateRange?.[1] &&
    dayjs(dateRange[0]).isSame(dayjs().subtract(1, "day"), "day") &&
    dayjs(dateRange[1]).isSame(dayjs().subtract(1, "day"), "day");

  const handleReset = () => {
    if (showUserFilter) setSelectedTechnicians([]);
    if (showUserGroupsFilter) setSelectedUserGroups([]);
    if (showGroupTitlesFilter) setSelectedGroupTitles([]);
    if (showDateFilter) setDateRange([]);
  };

  const handleApply = () => {
    onApply?.({
      selectedTechnicians,
      selectedUserGroups,
      selectedGroupTitles,
      dateRange,
    });
    onClose?.();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={getLanguageByKey("Filtru")}
      size="lg"
      centered
      styles={{
        content: { height: 900, display: "flex", flexDirection: "column" },
        body: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
      }}
    >
      {/* Весь контент модалки — флекс-колонка на всю высоту:
          Header (скрытый) → Scrollable content → Sticky footer */}
      <Box style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Прокручиваемая часть с полями — ВЕРТИКАЛЬНО */}
        <Box style={{ flex: 1, overflowY: "auto" }}>
          <Stack gap="md">
            {/* Фильтр по пользователям */}
            {showUserFilter && (
              <UserGroupMultiSelect
                value={selectedTechnicians}
                onChange={handleUsersChange}
                placeholder={getLanguageByKey("User")}
                label={getLanguageByKey("User")}
                techniciansData={formattedTechnicians}
                mode="multi"
              />
            )}

            {/* Фильтр по группам пользователей */}
            {showUserGroupsFilter && (
              <MultiSelect
                data={userGroupsOptions}
                value={selectedUserGroups}
                onChange={handleUserGroupsChange}
                searchable
                clearable
                maxDropdownHeight={260}
                placeholder={getLanguageByKey("User group")}
                nothingFoundMessage={getLanguageByKey("Nimic găsit")}
                disabled={loadingUserGroups}
              />
            )}

            {/* Фильтр по названиям групп */}
            {showGroupTitlesFilter && (
              <MultiSelect
                data={groupTitleSelectData}
                value={selectedGroupTitles}
                onChange={(v) => setSelectedGroupTitles(v || [])}
                searchable
                clearable
                maxDropdownHeight={260}
                nothingFoundMessage={getLanguageByKey("Nimic găsit")}
                placeholder={getLanguageByKey("Group title")}
              />
            )}

            {/* Фильтр по датам */}
            {showDateFilter && (
              <Group gap="xs" align="center">
                <Button
                  variant={isToday ? "filled" : "default"}
                  onClick={() => setDateRange(getStartEndDateRange(new Date()))}
                >
                  {getLanguageByKey("azi")}
                </Button>
                <Button
                  variant={isYesterday ? "filled" : "default"}
                  onClick={() => setDateRange(getYesterdayDate())}
                >
                  {getLanguageByKey("ieri")}
                </Button>
                <DatePickerInput
                  clearable
                  type="range"
                  value={dateRange}
                  onChange={(val) => setDateRange(val || [])}
                  valueFormat={YYYY_MM_DD}
                  placeholder={getLanguageByKey("Selectează o dată")}
                />
              </Group>
            )}
          </Stack>
        </Box>

        {/* Футер ВСЕГДА снизу */}
        <Box style={{ borderTop: "1px solid var(--mantine-color-gray-3)", paddingTop: 12, marginTop: 12 }}>
          <Group justify="space-between">
            <Button variant="default" onClick={handleReset}>
              {getLanguageByKey("Reset")}
            </Button>
            <Group>
              <Button variant="default" onClick={onClose}>
                {getLanguageByKey("Anulează")}
              </Button>
              <Button onClick={handleApply}>
                {getLanguageByKey("Aplică")}
              </Button>
            </Group>
          </Group>
        </Box>
      </Box>
    </Modal>
  );
};
