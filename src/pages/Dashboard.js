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
import { Spin } from "@components";
import { useGetTechniciansList, useDashboardData } from "../hooks";
import { Filter } from "../Components/DashboardComponent/Filter/Filter";
import { safeArray, pickIds } from "../utils/dashboardHelpers";

const t = (key) => String(getLanguageByKey?.(key) ?? key);

const WIDGET_TYPE_OPTIONS = [
  { value: "calls", label: t("Calls") },
  { value: "messages", label: t("Messages") },
  { value: "ticket_state", label: t("Ticket State") },
  { value: "tickets_into_work", label: t("Tickets Into Work") },
  { value: "system_usage", label: t("System usage") },
  { value: "ticket_distribution", label: t("Ticket Distribution") },
  { value: "closed_tickets_count", label: t("Closed Tickets Count") },
  { value: "tickets_by_depart_count", label: t("Tickets By Depart Count") },
  { value: "ticket_lifetime_stats", label: t("Ticket Lifetime Stats") },
  { value: "ticket_rate", label: t("Ticket Rate") },
  { value: "workflow_from_change", label: t("Workflow From Change") },
  { value: "workflow_to_change", label: t("Workflow Change To") },
  { value: "ticket_creation", label: t("Ticket Creation") },
  { value: "workflow_from_de_prelucrat", label: t("Workflow From De Prelucrat") },
  { value: "workflow_duration", label: t("Workflow Duration") },
  { value: "ticket_destination", label: t("Ticket Destination") },
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

  // имена по user_id
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
        } else if (widgetType === "ticket_state") {
          res = await api.dashboard.getTicketStateWidget(payload);
        } else if (widgetType === "tickets_into_work") {
          res = await api.dashboard.getTicketsIntoWorkWidget(payload);
        } else if (widgetType === "system_usage") {
          res = await api.dashboard.getSystemUsageWidget(payload);
        } else if (widgetType === "ticket_distribution") {
          res = await api.dashboard.getTicketDistributionWidget(payload);
        } else if (widgetType === "closed_tickets_count") {
          res = await api.dashboard.getClosedTicketsCountWidget(payload);
        } else if (widgetType === "tickets_by_depart_count") {
          res = await api.dashboard.getTicketsByDepartCountWidget(payload);
        } else if (widgetType === "ticket_lifetime_stats") {
          res = await api.dashboard.getTicketLifetimeStatsWidget(payload);
        } else if (widgetType === "ticket_rate") {
          res = await api.dashboard.getTicketRateWidget(payload);
        } else if (widgetType === "workflow_from_change") {
          res = await api.dashboard.getWorkflowFromChangeWidget(payload);
        } else if (widgetType === "workflow_to_change") {
          res = await api.dashboard.getWorkflowToChangeWidget(payload);
        } else if (widgetType === "ticket_creation") {
          res = await api.dashboard.getTicketCreationWidget(payload);
        } else if (widgetType === "workflow_from_de_prelucrat") {
          res = await api.dashboard.getWorkflowFromDePrelucratWidget(payload);
        } else if (widgetType === "workflow_duration") {
          res = await api.dashboard.getWorkflowDurationWidget(payload);
        } else if (widgetType === "ticket_destination") {
          res = await api.dashboard.getTicketDestinationWidget(payload);
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
    fetchByType(buildPayloadCommon());
  }, [buildPayloadCommon, fetchByType, widgetType, dateRange]);

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


  // построение списка виджетов
  const widgets = useDashboardData(rawData, userNameById, widgetType, getLanguageByKey);

  const handleApplyFilter = useCallback((meta) => {
    setSelectedTechnicians(meta?.selectedTechnicians || []);
    setSelectedUserGroups(meta?.selectedUserGroups || []);
    setSelectedGroupTitles(meta?.selectedGroupTitles || []);
    setDateRange(meta?.dateRange || []);
  }, []);

  // Проверяем, активен ли фильтр
  const isFilterActive = useMemo(() => {
    const hasTechnicians = selectedTechnicians?.length > 0;
    const hasUserGroups = selectedUserGroups?.length > 0;
    const hasGroupTitles = selectedGroupTitles?.length > 0;
    const hasDateRange = dateRange?.length === 2 && dateRange[0] && dateRange[1];

    return hasTechnicians || hasUserGroups || hasGroupTitles || hasDateRange;
  }, [selectedTechnicians, selectedUserGroups, selectedGroupTitles, dateRange]);

  return (
    <Stack gap={12}>
      {/* Центрированный заголовок */}
      <Flex ref={headerRowRef} className="dashboard-header-container" p="md" justify="center" style={{ borderBottom: "1px solid #e9ecef" }}>
        <Stack gap="md" align="center" style={{ width: "100%", maxWidth: "600px" }}>
          <Text fw={700} size="2rem" style={{ fontSize: "2.5rem", paddingTop: "2rem" }}>
            {getLanguageByKey("Dashboard")}
          </Text>

          <Group gap="sm" justify="center">
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

            <Tooltip label={getLanguageByKey("Filtru")}>
              <ActionIcon
                variant="light"
                size="lg"
                onClick={() => setFilterOpened(true)}
                aria-label="open-filter"
                color={isFilterActive ? "green" : "gray"}
                style={{
                  backgroundColor: isFilterActive ? "#51cf66" : "white",
                  border: isFilterActive ? "1px solid #51cf66" : "1px solid #e9ecef",
                  color: isFilterActive ? "white" : "#868e96"
                }}
              >
                <LuFilter size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Stack>
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
          pb="200px" pl="200px" pr="200px" pt="50px"
        >
          <DashboardGrid widgets={widgets} dateRange={dateRange} widgetType={widgetType} />
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
        widgetType={widgetType}
      />
    </Stack>
  );
};
