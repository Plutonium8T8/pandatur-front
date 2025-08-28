import { useMemo } from "react";
import dayjs from "dayjs";
import { Button, Group, MultiSelect } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { getLanguageByKey } from "../../utils";
import { DD_MM_YYYY } from "../../../app-constants";
import { useGetTechniciansList } from "../../../hooks";
import { formatMultiSelectData, getGroupUserMap } from "../../utils/multiSelectUtils";

// импорт твоих workflow utils с мапой userGroupsToGroupTitle
import { userGroupsToGroupTitle } from "../../utils/workflowUtils"; // поправь путь под свой проект

const getStartEndDateRange = (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return [startOfDay, endOfDay];
};

const getYesterdayDate = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return getStartEndDateRange(yesterday);
};

// служебка — префикс групп из formatMultiSelectData (поддерживаем "__group__")
const GROUP_PREFIX = "__group__";
const toGroupKey = (label) => `${GROUP_PREFIX}${label}`;
const fromGroupKey = (key) => key?.startsWith(GROUP_PREFIX) ? key.slice(GROUP_PREFIX.length) : key;

/**
 * props:
 * - onSelectedTechnicians(val: string[])
 * - onSelectedUserGroups(val: string[])       // НОВОЕ (массив ЛЕЙБЛОВ групп, без "__group__")
 * - onSelectedGroupTitles(val: string[])      // НОВОЕ (массив value для group title)
 * - onSelectDataRange(val: [Date|nil, Date|nil])
 * - selectedTechnicians: string[]
 * - selectedUserGroups: string[]              // НОВОЕ
 * - selectedGroupTitles: string[]             // НОВОЕ
 * - dateRange: [Date|nil, Date|nil]
 */
export const Filter = ({
  onSelectedTechnicians,
  onSelectedUserGroups,
  onSelectedGroupTitles,
  onSelectDataRange,
  selectedTechnicians = [],
  selectedUserGroups = [],
  selectedGroupTitles = [],
  dateRange = [],
}) => {
  const { technicians, loading: loadingTechnicians } = useGetTechniciansList();

  // данные для мультиселекта пользователей (включая группы c "__group__")
  const formattedTechnicians = useMemo(
    () => formatMultiSelectData(technicians),
    [technicians]
  );

  // карта: "__group__{groupLabel}" -> string[] userIds
  const groupUserMap = useMemo(
    () => getGroupUserMap(technicians),
    [technicians]
  );

  // все возможные названия групп (человекочитаемые лейблы)
  const allUserGroupLabels = useMemo(() => {
    const labels = Array.from(groupUserMap.keys())
      .map(fromGroupKey)
      .filter(Boolean);
    // уникальность
    return Array.from(new Set(labels));
  }, [groupUserMap]);

  // данные для мультиселекта "Группы пользователей"
  const userGroupsSelectData = useMemo(
    () => allUserGroupLabels.map((g) => ({ value: g, label: g })),
    [allUserGroupLabels]
  );

  // все возможные group titles (по мапе прав)
  const allGroupTitles = useMemo(() => {
    const all = new Set();
    Object.values(userGroupsToGroupTitle || {}).forEach((arr) => (arr || []).forEach((v) => all.add(v)));
    return Array.from(all);
  }, []);
  const groupTitleSelectData = useMemo(
    () => allGroupTitles.map((v) => ({ value: v, label: v })),
    [allGroupTitles]
  );

  // ---- Автозаполнение по выбору пользователей ----
  const handleUsersChange = (val) => {
    // 1) обработка выбора групп "__group__"
    const last = val[val.length - 1];
    const isGroupChip = typeof last === "string" && last.startsWith(GROUP_PREFIX);
    let nextUsers = val || [];

    if (isGroupChip) {
      const groupUsers = groupUserMap.get(last) || [];
      nextUsers = Array.from(new Set([...(selectedTechnicians || []), ...groupUsers]));
    }

    onSelectedTechnicians(nextUsers);

    // 2) найти группы, к которым относятся выбранные пользователи
    //    (по всем записям groupUserMap)
    const groupsForUsers = new Set();
    for (const [groupKey, users] of groupUserMap.entries()) {
      const hasAny = (nextUsers || []).some((u) => users.includes(u));
      if (hasAny) groupsForUsers.add(fromGroupKey(groupKey));
    }

    const nextUserGroups = Array.from(groupsForUsers);
    onSelectedUserGroups?.(nextUserGroups);

    // 3) из выбранных групп получить доступные group titles
    const titlesSet = new Set();
    nextUserGroups.forEach((g) => {
      (userGroupsToGroupTitle?.[g] || []).forEach((t) => titlesSet.add(t));
    });
    const nextGroupTitles = Array.from(titlesSet);
    onSelectedGroupTitles?.(nextGroupTitles);
  };

  // ---- Ручной выбор групп пользователей -> пересчитать group titles ----
  const handleUserGroupsChange = (groups) => {
    onSelectedUserGroups?.(groups || []);

    const titlesSet = new Set();
    (groups || []).forEach((g) => {
      (userGroupsToGroupTitle?.[g] || []).forEach((t) => titlesSet.add(t));
    });
    onSelectedGroupTitles?.(Array.from(titlesSet));
  };

  // ---- Ручной выбор group titles (без побочных эффектов) ----
  const handleGroupTitlesChange = (titles) => {
    onSelectedGroupTitles?.(titles || []);
  };

  const isToday =
    dateRange?.[0] && dateRange?.[1] &&
    dayjs(dateRange[0]).isSame(dayjs(), "day") &&
    dayjs(dateRange[1]).isSame(dayjs(), "day");

  const isYesterday =
    dateRange?.[0] && dateRange?.[1] &&
    dayjs(dateRange[0]).isSame(dayjs().subtract(1, "day"), "day") &&
    dayjs(dateRange[1]).isSame(dayjs().subtract(1, "day"), "day");

  return (
    <Group wrap="wrap" gap="sm" align="center">
      <MultiSelect
        w={360}
        data={formattedTechnicians}
        value={selectedTechnicians}
        onChange={handleUsersChange}
        searchable
        clearable
        placeholder={getLanguageByKey("Selectează operatorii")}
        nothingFoundMessage={getLanguageByKey("Nimic găsit")}
        maxDropdownHeight={300}
        disabled={loadingTechnicians}
        aria-label="Users"
      />

      {/* НОВОЕ: Группы пользователей */}
      <MultiSelect
        w={260}
        data={userGroupsSelectData}
        value={selectedUserGroups}
        onChange={handleUserGroupsChange}
        searchable
        clearable
        placeholder={getLanguageByKey("Alege grupul")}
        nothingFoundMessage={getLanguageByKey("Nimic găsit")}
        maxDropdownHeight={260}
        aria-label="User groups"
      />

      {/* НОВОЕ: Group Title */}
      <MultiSelect
        w={280}
        data={groupTitleSelectData}
        value={selectedGroupTitles}
        onChange={handleGroupTitlesChange}
        searchable
        clearable
        placeholder={getLanguageByKey("Alege group title")}
        nothingFoundMessage={getLanguageByKey("Nimic găsit")}
        maxDropdownHeight={260}
        aria-label="Group titles"
      />

      <Group gap="xs" align="center">
        <Button
          variant={isToday ? "filled" : "default"}
          onClick={() => onSelectDataRange(getStartEndDateRange(new Date()))}
        >
          {getLanguageByKey("azi")}
        </Button>

        <Button
          variant={isYesterday ? "filled" : "default"}
          onClick={() => onSelectDataRange(getYesterdayDate())}
        >
          {getLanguageByKey("ieri")}
        </Button>

        <DatePickerInput
          clearable
          valueFormat={DD_MM_YYYY}
          type="range"
          placeholder={getLanguageByKey("Selectează o dată")}
          value={dateRange}
          onChange={(date) => onSelectDataRange(date || [])}
        />
      </Group>
    </Group>
  );
};
