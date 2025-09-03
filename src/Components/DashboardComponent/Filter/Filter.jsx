import { useMemo, useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import { Button, Group, MultiSelect, Modal, Stack, Divider, Box } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { getLanguageByKey } from "../../utils";
import { YYYY_MM_DD } from "../../../app-constants";
import { useGetTechniciansList } from "../../../hooks";
import { formatMultiSelectData, getGroupUserMap } from "../../utils/multiSelectUtils";
import { user as userApi } from "../../../api/user";
import { userGroupsToGroupTitle } from "../../utils/workflowUtils";

const GROUP_PREFIX = "__group__";
const fromGroupKey = (key) => (key?.startsWith(GROUP_PREFIX) ? key.slice(GROUP_PREFIX.length) : key);
const toYMD = (d) => (d ? dayjs(d).format("YYYY-MM-DD") : undefined);

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
  opened,
  onClose,
  onApply, // (payload, meta) => void
  initialTechnicians = [],
  initialUserGroups = [],
  initialGroupTitles = [],
  initialDateRange = [],
}) => {
  const { technicians, loading: loadingTechnicians } = useGetTechniciansList();
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
        const data = await userApi.getGroupsList();
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

  const allGroupTitles = useMemo(() => {
    const all = new Set();
    Object.values(userGroupsToGroupTitle || {}).forEach((arr) => (arr || []).forEach((v) => all.add(v)));
    return Array.from(all);
  }, []);
  const groupTitleSelectData = useMemo(
    () => allGroupTitles.map((v) => ({ value: v, label: v })),
    [allGroupTitles]
  );

  const handleUsersChange = (val) => {
    const last = val[val.length - 1];
    const isGroupChip = typeof last === "string" && last.startsWith(GROUP_PREFIX);
    let nextUsers = val || [];
    if (isGroupChip) {
      const groupUsers = groupUserMap.get(last) || [];
      nextUsers = Array.from(new Set([...(selectedTechnicians || []), ...groupUsers]));
    }
    setSelectedTechnicians(nextUsers);

    const groupsForUsers = new Set();
    for (const [groupKey, users] of groupUserMap.entries()) {
      const hasAny = (nextUsers || []).some((u) => users.includes(u));
      if (hasAny) groupsForUsers.add(fromGroupKey(groupKey));
    }
    const nextUserGroups = Array.from(groupsForUsers);
    setSelectedUserGroups(nextUserGroups);

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

  const isToday =
    dateRange?.[0] && dateRange?.[1] &&
    dayjs(dateRange[0]).isSame(dayjs(), "day") &&
    dayjs(dateRange[1]).isSame(dayjs(), "day");

  const isYesterday =
    dateRange?.[0] && dateRange?.[1] &&
    dayjs(dateRange[0]).isSame(dayjs().subtract(1, "day"), "day") &&
    dayjs(dateRange[1]).isSame(dayjs().subtract(1, "day"), "day");

  const handleReset = () => {
    setSelectedTechnicians([]);
    setSelectedUserGroups([]);
    setSelectedGroupTitles([]);
    setDateRange([]);
  };

  const handleApply = () => {
    const payload = buildPayload();
    onApply?.(payload, {
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
            <MultiSelect
              data={formattedTechnicians}
              value={selectedTechnicians}
              onChange={handleUsersChange}
              searchable
              clearable
              maxDropdownHeight={300}
              placeholder={getLanguageByKey("User")}
              nothingFoundMessage={getLanguageByKey("Nimic găsit")}
              disabled={loadingTechnicians}
            />

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

            {/* Быстрые даты + диапазон */}
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
