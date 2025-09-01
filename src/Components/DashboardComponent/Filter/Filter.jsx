import { useMemo, useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import { Button, Group, MultiSelect } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { getLanguageByKey } from "../../utils";
import { DD_MM_YYYY } from "../../../app-constants";
import { useGetTechniciansList } from "../../../hooks";
import { formatMultiSelectData, getGroupUserMap } from "../../utils/multiSelectUtils";
import { user as userApi } from "../../../api/user";
import { userGroupsToGroupTitle } from "../../utils/workflowUtils";

const GROUP_PREFIX = "__group__";
const fromGroupKey = (key) => (key?.startsWith(GROUP_PREFIX) ? key.slice(GROUP_PREFIX.length) : key);

// → YYYY-MM-DD
const toYMD = (d) => (d ? dayjs(d).format("YYYY-MM-DD") : undefined);

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

// убираем пустые поля из payload
const compactPayload = (p) => {
  const copy = { ...p };
  if (Array.isArray(copy.user_ids) && !copy.user_ids.length) delete copy.user_ids;
  if (Array.isArray(copy.user_groups) && !copy.user_groups.length) delete copy.user_groups;
  if (Array.isArray(copy.group_titles) && !copy.group_titles.length) delete copy.group_titles;
  const ts = copy.attributes?.timestamp || {};
  if (!ts.from && !ts.to) delete copy.attributes;
  return copy;
};

export const Filter = ({
  onSelectedTechnicians,
  onSelectedUserGroups,
  onSelectedGroupTitles,
  onSelectDataRange,
  onChangePayload, // готовый payload для POST /api/dashboard/widget/calls-static
  onApply,         // вызвать ручной apply(payload)
  selectedTechnicians = [],
  selectedUserGroups = [],
  selectedGroupTitles = [],
  dateRange = [],
}) => {
  const { technicians, loading: loadingTechnicians } = useGetTechniciansList();

  const formattedTechnicians = useMemo(() => formatMultiSelectData(technicians), [technicians]);
  const groupUserMap = useMemo(() => getGroupUserMap(technicians), [technicians]);

  const [userGroupsOptions, setUserGroupsOptions] = useState([]);
  const [loadingUserGroups, setLoadingUserGroups] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingUserGroups(true);
        const data = await userApi.getGroupsList();
        const opts = Array.from(new Set((data || []).map((g) => g?.name).filter(Boolean))).map(
          (name) => ({ value: name, label: name })
        );
        if (mounted) setUserGroupsOptions(opts);
      } catch (e) {
        console.error("Не удалось загрузить группы пользователей:", e);
        if (mounted) setUserGroupsOptions([]);
      } finally {
        if (mounted) setLoadingUserGroups(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // все возможные group_title
  const allGroupTitles = useMemo(() => {
    const all = new Set();
    Object.values(userGroupsToGroupTitle || {}).forEach((arr) =>
      (arr || []).forEach((v) => all.add(v))
    );
    return Array.from(all);
  }, []);
  const groupTitleSelectData = useMemo(
    () => allGroupTitles.map((v) => ({ value: v, label: v })),
    [allGroupTitles]
  );

  // === handlers ===
  const handleUsersChange = (val) => {
    const last = val[val.length - 1];
    const isGroupChip = typeof last === "string" && last.startsWith(GROUP_PREFIX);
    let nextUsers = val || [];

    if (isGroupChip) {
      const groupUsers = groupUserMap.get(last) || [];
      nextUsers = Array.from(new Set([...(selectedTechnicians || []), ...groupUsers]));
    }

    onSelectedTechnicians?.(nextUsers);

    // авто-вывод user_groups по выбранным пользователям
    const groupsForUsers = new Set();
    for (const [groupKey, users] of groupUserMap.entries()) {
      const hasAny = (nextUsers || []).some((u) => users.includes(u));
      if (hasAny) groupsForUsers.add(fromGroupKey(groupKey));
    }
    const nextUserGroups = Array.from(groupsForUsers);
    onSelectedUserGroups?.(nextUserGroups);

    // авто-вывод group_titles по группам
    const titlesSet = new Set();
    nextUserGroups.forEach((g) => (userGroupsToGroupTitle?.[g] || []).forEach((t) => titlesSet.add(t)));
    onSelectedGroupTitles?.(Array.from(titlesSet));
  };

  const handleUserGroupsChange = (groups) => {
    onSelectedUserGroups?.(groups || []);
    const titlesSet = new Set();
    (groups || []).forEach((g) => (userGroupsToGroupTitle?.[g] || []).forEach((t) => titlesSet.add(t)));
    onSelectedGroupTitles?.(Array.from(titlesSet));
  };

  const handleGroupTitlesChange = (titles) => {
    onSelectedGroupTitles?.(titles || []);
  };

  const isToday =
    dateRange?.[0] &&
    dateRange?.[1] &&
    dayjs(dateRange[0]).isSame(dayjs(), "day") &&
    dayjs(dateRange[1]).isSame(dayjs(), "day");

  const isYesterday =
    dateRange?.[0] &&
    dateRange?.[1] &&
    dayjs(dateRange[0]).isSame(dayjs().subtract(1, "day"), "day") &&
    dayjs(dateRange[1]).isSame(dayjs().subtract(1, "day"), "day");

  const buildPayload = useCallback(() => {
    const [fromDate, toDate] = dateRange || [];
    const payload = {
      user_ids: selectedTechnicians,
      user_groups: selectedUserGroups,
      group_titles: selectedGroupTitles,
      attributes:
        fromDate || toDate
          ? { timestamp: { from: toYMD(fromDate || undefined), to: toYMD(toDate || undefined) } }
          : undefined,
    };
    return compactPayload(payload);
  }, [selectedTechnicians, selectedUserGroups, selectedGroupTitles, dateRange]);

  // сообщаем наверх при каждом изменении
  useEffect(() => {
    onChangePayload?.(buildPayload());
  }, [buildPayload, onChangePayload]);

  return (
    <Group wrap="wrap" gap="sm" align="center" pr="lg">
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

      <MultiSelect
        w={260}
        data={userGroupsOptions}
        value={selectedUserGroups}
        onChange={handleUserGroupsChange}
        searchable
        clearable
        placeholder={getLanguageByKey("Alege grupul")}
        nothingFoundMessage={getLanguageByKey("Nimic găsit")}
        maxDropdownHeight={260}
        aria-label="User groups"
        disabled={loadingUserGroups}
      />

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
          onClick={() => onSelectDataRange?.(getStartEndDateRange(new Date()))}
        >
          {getLanguageByKey("azi")}
        </Button>

        <Button
          variant={isYesterday ? "filled" : "default"}
          onClick={() => onSelectDataRange?.(getYesterdayDate())}
        >
          {getLanguageByKey("ieri")}
        </Button>

        <DatePickerInput
          clearable
          valueFormat={DD_MM_YYYY}
          type="range"
          placeholder={getLanguageByKey("Selectează o dată")}
          value={dateRange}
          onChange={(date) => onSelectDataRange?.(date || [])}
        />

      </Group>
    </Group>
  );
};
