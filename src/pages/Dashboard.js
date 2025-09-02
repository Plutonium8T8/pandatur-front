import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { format } from "date-fns";
import { useSnackbar } from "notistack";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Flex, Text, Box, Stack, ActionIcon, Tooltip, Select, Group } from "@mantine/core";
import { LuFilter } from "react-icons/lu";
import { api } from "../api";
import DashboardGrid from "../Components/DashboardComponent/DashboardGrid";
import { showServerError, getLanguageByKey } from "@utils";
import { Spin, PageHeader } from "@components";
import { useGetTechniciansList } from "../hooks";
import { Filter } from "../Components/DashboardComponent/Filter/Filter";

const safeArray = (a) => (Array.isArray(a) ? a : []);
const pickIds = (arr) => safeArray(arr).map((x) => Number(x?.value ?? x)).filter((n) => Number.isFinite(n));

const BG = {
  general: "rgba(99, 102, 241, 0.28)",  // indigo
  by_user_group: "rgba(168, 85, 247, 0.28)",  // purple
  by_user: "rgba(59, 130, 246, 0.28)",  // blue
  by_group_title: "rgba(245, 158, 11, 0.30)",  // amber
  by_source: "rgba(6, 182, 212, 0.28)",   // cyan
};

const t = (key) => String(getLanguageByKey?.(key) ?? key);

// опции для Select с фолбэками
const WIDGET_TYPE_OPTIONS = [
  { value: "calls", label: t("Calls") },
  { value: "messages", label: t("Messages") },
  { value: "system_usage", label: t("System usage"), disabled: true },
  { value: "tickets_count", label: t("Tickets count"), disabled: true },
  { value: "distributor", label: t("Distributor"), disabled: true },
  { value: "workflow_change", label: t("Workflow change"), disabled: true },
  { value: "ticket_create_count", label: t("Tickets created"), disabled: true },
  { value: "contract_closed", label: t("Contracts closed"), disabled: true },
  { value: "ticket_lifetime", label: t("Ticket lifetime"), disabled: true },
  { value: "contract_departure", label: t("Contract departures"), disabled: true },
  { value: "workflow_percentage", label: t("Workflow percentage"), disabled: true },
  { value: "workflow_duration", label: t("Workflow duration"), disabled: true },
  { value: "country_count", label: t("Countries"), disabled: true },
];

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(400);

  // тип виджетов
  const [widgetType, setWidgetType] = useState("calls");

  // состояние фильтра
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [selectedUserGroups, setSelectedUserGroups] = useState([]);
  const [selectedGroupTitles, setSelectedGroupTitles] = useState([]);
  const [dateRange, setDateRange] = useState([]);

  const [filterOpened, setFilterOpened] = useState(false);

  const { enqueueSnackbar } = useSnackbar();
  const headerRowRef = useRef(null);
  const scrollRef = useRef(null);
  const requestIdRef = useRef(0);

  const [rawData, setRawData] = useState(null);
  const [dataError, setDataError] = useState(null);

  const { technicians } = useGetTechniciansList();
  const userNameById = useMemo(() => {
    const map = new Map();
    safeArray(technicians).forEach((t) => {
      const id = Number(t?.value);
      const name = String(t?.label ?? "").trim();
      if (Number.isFinite(id) && name) map.set(id, name);
    });
    return map;
  }, [technicians]);

  // общий payload
  const buildPayloadCommon = useCallback(() => {
    const [start, end] = dateRange || [];
    const payload = {
      user_ids: pickIds(selectedTechnicians),
      user_groups: selectedUserGroups?.length ? selectedUserGroups : undefined,
      group_titles: selectedGroupTitles?.length ? selectedGroupTitles : undefined,
      attributes:
        start || end
          ? { timestamp: { from: start ? format(start, "yyyy-MM-dd") : undefined, to: end ? format(end, "yyyy-MM-dd") : undefined } }
          : undefined,
    };
    if (!payload.user_ids?.length) delete payload.user_ids;
    if (!payload.user_groups?.length) delete payload.user_groups;
    if (!payload.group_titles?.length) delete payload.group_titles;
    if (!payload.attributes?.timestamp?.from && !payload.attributes?.timestamp?.to) delete payload.attributes;
    return payload;
  }, [selectedTechnicians, selectedUserGroups, selectedGroupTitles, dateRange]);

  // payload под конкретный тип (messages требует timestamp_after/before)
  const buildPayloadForType = useCallback(() => {
    const common = buildPayloadCommon();
    if (widgetType !== "messages") return common;

    const after = common?.attributes?.timestamp?.from;
    const before = common?.attributes?.timestamp?.to;

    const msgAttrs =
      after || before
        ? { timestamp_after: after, timestamp_before: before }
        : undefined;

    const { attributes, ...rest } = common;
    return { ...rest, attributes: msgAttrs };
  }, [buildPayloadCommon, widgetType]);

  // запрос по типу
  const fetchByType = useCallback(
    async (payload) => {
      const thisReqId = ++requestIdRef.current;
      setIsLoading(true);
      setDataError(null);
      try {
        let res = null;
        if (widgetType === "calls") {
          res = await api.dashboard.getWidgetCalls(payload);
        } else if (widgetType === "messages") {
          res = await api.dashboard.getWidgetMessages(payload);
        }
        if (requestIdRef.current !== thisReqId) return;
        setRawData(res || null);
      } catch (e) {
        if (requestIdRef.current !== thisReqId) return;
        setRawData(null);
        setDataError(e?.message || String(e));
        enqueueSnackbar(showServerError(e), { variant: "error" });
      } finally {
        if (requestIdRef.current === thisReqId) setIsLoading(false);
      }
    },
    [enqueueSnackbar, widgetType]
  );

  // автозагрузка при изменении диапазона/типа
  useEffect(() => {
    const [start, end] = dateRange || [];
    if (!!start !== !!end) return; // нужен полноценный диапазон
    fetchByType(buildPayloadForType());
  }, [buildPayloadForType, fetchByType, widgetType]);

  // размеры
  const recalcSizes = useCallback(() => {
    const headerH = headerRowRef.current?.offsetHeight || 0;
    const margins = 24;
    const viewportH = window.innerHeight || 800;
    setScrollHeight(Math.max(240, viewportH - headerH - margins));
  }, []);
  useEffect(() => {
    recalcSizes();
    window.addEventListener("resize", recalcSizes);
    const ro = new ResizeObserver(recalcSizes);
    if (scrollRef.current) ro.observe(scrollRef.current);
    return () => {
      window.removeEventListener("resize", recalcSizes);
      ro.disconnect();
    };
  }, [recalcSizes]);

  // утилиты для чтения разных схем
  const pickNum = (obj, keys) => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v);
    }
    return 0;
  };
  const countsFrom = (obj) => ({
    incoming: pickNum(obj, ["incoming_calls_count", "incoming_messages_count", "incoming_count", "incoming", "in"]),
    outgoing: pickNum(obj, ["outgoing_calls_count", "outgoing_messages_count", "outgoing_count", "outgoing", "out"]),
    total: pickNum(obj, ["total_calls_count", "total_messages_count", "total_count", "total", "count", "all"]),
  });

  // нормализация by_platform (массив/объект → массив)
  const mapPlatforms = (bp) => {
    if (!bp) return [];
    if (Array.isArray(bp)) return bp;
    if (typeof bp === "object") {
      return Object.entries(bp).map(([platform, stats]) => ({ platform, ...(stats || {}) }));
    }
    return [];
  };

  // построение списка виджетов
  const widgets = useMemo(() => {
    const D = rawData || {};
    const W = [];

    // General
    if (D.general) {
      const c = countsFrom(D.general);
      W.push({ id: "sep-general", type: "separator", label: getLanguageByKey("General") });
      W.push({
        id: "general",
        type: "general",
        title:
          widgetType === "messages"
            ? getLanguageByKey("Total messages for the period")
            : getLanguageByKey("Total calls for the period"),
        subtitle: getLanguageByKey("All company"),
        incoming: c.incoming,
        outgoing: c.outgoing,
        total: c.total,
        bg: BG.general,
      });
    }

    // By platform (для messages)
    if (widgetType === "messages") {
      const platforms = mapPlatforms(D.by_platform);
      if (platforms.length) {
        W.push({ id: "sep-platform", type: "separator", label: getLanguageByKey("By platform") });
        platforms.forEach((row, idx) => {
          const c = countsFrom(row || {});
          const name = row?.platform || "-";
          W.push({
            id: `plat-${name ?? idx}`,
            type: "source",
            title: getLanguageByKey("Platform"),
            subtitle: name,
            incoming: c.incoming,
            outgoing: c.outgoing,
            total: c.total,
            bg: BG.by_source,
          });
        });
      }
    }

    // By user group
    const byUserGroup = safeArray(D.by_user_group);
    if (byUserGroup.length) {
      W.push({ id: "sep-ug", type: "separator", label: getLanguageByKey("By user group") });
      byUserGroup.forEach((r, idx) => {
        const c = countsFrom(r);
        const name = r.user_group_name ?? r.user_group ?? r.group ?? "-";
        W.push({
          id: `ug-${idx}`,
          type: "group",
          title: getLanguageByKey("User group"),
          subtitle: name || "-",
          incoming: c.incoming,
          outgoing: c.outgoing,
          total: c.total,
          bg: BG.by_user_group,
        });
      });
    }

    // By user
    const byUser = safeArray(D.by_user);
    if (byUser.length) {
      W.push({ id: "sep-user", type: "separator", label: getLanguageByKey("By user") });
      byUser.forEach((r, idx) => {
        const c = countsFrom(r);
        const uid = Number(r.user_id);
        const name = userNameById.get(uid);
        const subtitle = (name || (Number.isFinite(uid) ? `ID ${uid}` : "-")) + (r.sipuni_id ? ` • ${r.sipuni_id}` : "");
        W.push({
          id: `user-${uid || idx}`,
          type: "user",
          title: getLanguageByKey("User"),
          subtitle,
          incoming: c.incoming,
          outgoing: c.outgoing,
          total: c.total,
          bg: BG.by_user,
        });
      });
    }

    // By group title
    const byGt = safeArray(D.by_group_title);
    if (byGt.length) {
      W.push({ id: "sep-gt", type: "separator", label: getLanguageByKey("By group title") });
      byGt.forEach((r, idx) => {
        const c = countsFrom(r);
        const name = r.group_title_name ?? r.group_title ?? r.group ?? "-";
        W.push({
          id: `gt-${name ?? idx}`,
          type: "group",
          title: getLanguageByKey("Group title"),
          subtitle: name || "-",
          incoming: c.incoming,
          outgoing: c.outgoing,
          total: c.total,
          bg: BG.by_group_title,
        });
      });
    }

    // By source (для calls — если бэк вернёт)
    const bySrc = safeArray(D.by_source);
    if (bySrc.length) {
      W.push({ id: "sep-src", type: "separator", label: getLanguageByKey("By source") });
      bySrc.forEach((r, idx) => {
        const c = countsFrom(r);
        const name = r.source ?? r.channel ?? r.platform ?? "-";
        W.push({
          id: `src-${name ?? idx}`,
          type: "source",
          title: getLanguageByKey("Source"),
          subtitle: name || "-",
          incoming: c.incoming,
          outgoing: c.outgoing,
          total: c.total,
          bg: BG.by_source,
        });
      });
    }

    return W;
  }, [rawData, userNameById, widgetType]);

  const handleApplyFilter = useCallback((payload, meta) => {
    setSelectedTechnicians(meta?.selectedTechnicians || []);
    setSelectedUserGroups(meta?.selectedUserGroups || []);
    setSelectedGroupTitles(meta?.selectedGroupTitles || []);
    setDateRange(meta?.dateRange || []);
  }, []);

  return (
    <Stack gap={12}>
      <Flex ref={headerRowRef} className="dashboard-header-container" p="md">
        <PageHeader
          title={getLanguageByKey("Dashboard")}
          extraInfo={
            <Group gap="sm">
              <Tooltip label={getLanguageByKey("Filtru")}>
                <ActionIcon variant="light" size="lg" onClick={() => setFilterOpened(true)} aria-label="open-filter">
                  <LuFilter size={18} />
                </ActionIcon>
              </Tooltip>

              <Select
                size="sm"
                w={220}
                value={widgetType}
                onChange={(v) => v && setWidgetType(v)}
                data={WIDGET_TYPE_OPTIONS}
                allowDeselect={false}
                placeholder={getLanguageByKey("Widget type")}
                aria-label="widget-type"
              />
            </Group>
          }
        />
      </Flex>

      {isLoading ? (
        <Flex align="center" justify="center" style={{ flex: 1, minHeight: 240 }}>
          <Spin />
        </Flex>
      ) : dataError ? (
        <Flex align="center" justify="center" style={{ flex: 1, minHeight: 240 }}>
          <Text c="red">{String(dataError)}</Text>
        </Flex>
      ) : (
        <Box
          ref={scrollRef}
          style={{ width: "100%", height: scrollHeight, overflowY: "auto", overflowX: "hidden", scrollbarGutter: "stable" }}
          p="lg"
        >
          <DashboardGrid widgets={widgets} dateRange={dateRange} />
        </Box>
      )}

      <Filter
        opened={filterOpened}
        onClose={() => setFilterOpened(false)}
        onApply={handleApplyFilter}
        initialTechnicians={selectedTechnicians}
        initialUserGroups={selectedUserGroups}
        initialGroupTitles={selectedGroupTitles}
        initialDateRange={dateRange}
      />
    </Stack>
  );
};
