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
  general: "#FFFFFF",     // белый
  by_user_group: "#93C5FD", // синий темнее (blue-300)
  by_user: "#DBEAFE",       // светло-синий темнее (blue-100)
  by_group_title: "#FFF5CC",// жёлтый (бледный)
  by_source: "#FFE8E8",     // красный (бледный)
};

const t = (key) => String(getLanguageByKey?.(key) ?? key);

const WIDGET_TYPE_OPTIONS = [
  { value: "calls", label: t("Calls") },
  { value: "messages", label: t("messages") },
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

  // payload под messages (timestamp_after/before)
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
  const countsFrom = useCallback((obj) => ({
    incoming: pickNum(obj, ["incoming_calls_count", "incoming_messages_count", "incoming_count", "incoming", "in"]),
    outgoing: pickNum(obj, ["outgoing_calls_count", "outgoing_messages_count", "outgoing_count", "outgoing", "out"]),
    total: pickNum(obj, ["total_calls_count", "total_messages_count", "total_count", "total", "count", "all"]),
  }), []);

  // утилиты для ticket state данных
  const ticketStateFrom = useCallback((obj) => ({
    oldClientTickets: pickNum(obj, ["old_client_tickets_count", "old_client", "old"]),
    newClientTickets: pickNum(obj, ["new_client_tickets_count", "new_client", "new"]),
    totalTickets: pickNum(obj, ["total_tickets_count", "total_tickets", "total"]),
  }), []);

  // утилиты для tickets into work данных
  const ticketsIntoWorkFrom = useCallback((obj) => ({
    takenIntoWorkTickets: pickNum(obj, ["taken_into_work_tickets_count", "taken_into_work", "taken"]),
  }), []);

  // утилиты для system usage данных
  const systemUsageFrom = useCallback((obj) => {
    const minutes = pickNum(obj, ["activity_minutes", "minutes", "min"]);
    const hours = pickNum(obj, ["activity_hours", "hours", "hrs"]);
    
    // Если есть минуты, конвертируем их в часы (с округлением до 2 знаков)
    const convertedHours = minutes ? Math.round((minutes / 60) * 100) / 100 : 0;
    
    return {
      activityMinutes: minutes,
      activityHours: hours || convertedHours, // Используем переданные часы или конвертированные из минут
    };
  }, []);

  // утилиты для ticket distribution данных
  const ticketDistributionFrom = useCallback((obj) => ({
    distributedTickets: pickNum(obj, ["distributed_tickets_count", "distributed_tickets", "distributed"]),
  }), []);

  // утилиты для closed tickets count данных
  const closedTicketsCountFrom = useCallback((obj) => ({
    olderThan11Days: pickNum(obj, ["older_than_11_days_count", "older_than_11_days", "older"]),
    newerThan11Days: pickNum(obj, ["newer_than_11_days_count", "newer_than_11_days", "newer"]),
    totalClosedTickets: pickNum(obj, ["total_closed_tickets_count", "total_closed_tickets", "total"]),
  }), []);

  const ticketsByDepartCountFrom = useCallback((obj) => ({
    lessThan14Days: pickNum(obj, ["less_than_14_days_count", "less_than_14_days", "less_14"]),
    between14And30Days: pickNum(obj, ["between_14_30_days_count", "between_14_30_days", "between_14_30"]),
    moreThan30Days: pickNum(obj, ["more_than_30_days_count", "more_than_30_days", "more_30"]),
    totalTickets: pickNum(obj, ["total_tickets_count", "total_tickets", "total"]) || 
      (pickNum(obj, ["less_than_14_days_count"]) + pickNum(obj, ["between_14_30_days_count"]) + pickNum(obj, ["more_than_30_days_count"])),
  }), []);

  // утилиты для ticket lifetime stats данных
  const ticketLifetimeStatsFrom = useCallback((obj) => ({
    totalLifetimeMinutes: pickNum(obj, ["total_lifetime_minutes", "total_lifetime", "total"]),
    averageLifetimeMinutes: pickNum(obj, ["average_lifetime_minutes", "average_lifetime", "average"]),
    ticketsProcessed: pickNum(obj, ["tickets_processed", "processed", "count"]),
    totalLifetimeHours: Math.round((pickNum(obj, ["total_lifetime_minutes", "total_lifetime", "total"]) || 0) / 60 * 10) / 10,
    averageLifetimeHours: Math.round((pickNum(obj, ["average_lifetime_minutes", "average_lifetime", "average"]) || 0) / 60 * 10) / 10,
  }), []);

  // утилиты для ticket rate данных
  const ticketRateFrom = useCallback((obj) => ({
    totalTransitions: pickNum(obj, ["total_transitions", "total", "count"]),
    directlyClosedCount: pickNum(obj, ["directly_closed_count", "directly_closed", "closed"]),
    directlyClosedPercentage: pickNum(obj, ["directly_closed_percentage", "closed_percentage", "closed_pct"]),
    workedOnCount: pickNum(obj, ["worked_on_count", "worked_on", "worked"]),
    workedOnPercentage: pickNum(obj, ["worked_on_percentage", "worked_percentage", "worked_pct"]),
  }), []);

  // утилиты для workflow from change данных
  const workflowFromChangeFrom = useCallback((obj) => ({
    luatInLucruChangedCount: pickNum(obj, ["luat_in_lucru_changed_count", "luat_in_lucru", "luat"]),
    ofertaTrimisaChangedCount: pickNum(obj, ["oferta_trimisa_changed_count", "oferta_trimisa", "oferta"]),
    totalChanges: pickNum(obj, ["total_changes", "total"]) ||
      (pickNum(obj, ["luat_in_lucru_changed_count"]) + pickNum(obj, ["oferta_trimisa_changed_count"])),
  }), []);

  // утилиты для workflow to change данных
  const workflowToChangeFrom = useCallback((obj) => ({
    contractIncheiatChangedCount: pickNum(obj, ["contract_incheiat_changed_count", "contract_incheiat", "contract"]),
  }), []);

  // утилиты для ticket creation данных
  const ticketCreationFrom = useCallback((obj) => ({
    ticketsCreatedCount: pickNum(obj, ["tickets_created_count", "tickets_created", "created"]),
  }), []);

  // утилиты для workflow from de prelucrat данных
  const workflowFromDePrelucratFrom = useCallback((obj) => {
    if (Array.isArray(obj)) {
      // Для general секции - это массив объектов
      const totalChanges = obj.reduce((sum, item) => sum + (pickNum(item, ["change_count", "count"]) || 0), 0);
      return {
        workflowChanges: obj.map(item => ({
          destination_workflow: item.destination_workflow || item.destination || "-",
          change_count: pickNum(item, ["change_count", "count"]) || 0,
        })),
        totalChanges,
      };
    } else {
      // Для других секций - это объект с workflow_changes массивом
      const workflowChanges = safeArray(obj.workflow_changes || obj.changes || []);
      const totalChanges = pickNum(obj, ["total_changes", "total"]) || 
        workflowChanges.reduce((sum, item) => sum + (pickNum(item, ["change_count", "count"]) || 0), 0);
      
      return {
        workflowChanges: workflowChanges.map(item => ({
          destination_workflow: item.destination_workflow || item.destination || "-",
          change_count: pickNum(item, ["change_count", "count"]) || 0,
        })),
        totalChanges,
      };
    }
  }, []);

  // утилиты для workflow duration данных
  const workflowDurationFrom = useCallback((obj) => ({
    totalDurationMinutes: pickNum(obj, ["total_duration_minutes", "total_duration", "duration"]) || 0,
    averageDurationMinutes: pickNum(obj, ["average_duration_minutes", "average_duration", "avg_duration"]) || 0,
    ticketsProcessed: pickNum(obj, ["tickets_processed", "tickets", "processed"]) || 0,
  }), []);

  // утилиты для ticket destination данных
  const ticketDestinationFrom = useCallback((obj) => {
    // Данные уже в нужном формате: { "Ofertă trimisă": { "Romania": 45, ... }, "Aprobat cu client": { ... } }
    return obj || {};
  }, []);

  // утилиты для ticket state данных
  const ticketStateFrom = (obj) => ({
    oldClientTickets: pickNum(obj, ["old_client_tickets_count", "old_client", "old"]),
    newClientTickets: pickNum(obj, ["new_client_tickets_count", "new_client", "new"]),
    totalTickets: pickNum(obj, ["total_tickets_count", "total_tickets", "total"]),
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
      if (widgetType === "ticket_state") {
        const ts = ticketStateFrom(D.general);
        W.push({
          id: "general",
          type: "ticket_state",
          title: getLanguageByKey("Total tickets for the period"),
          subtitle: getLanguageByKey("All company"),
          oldClientTickets: ts.oldClientTickets,
          newClientTickets: ts.newClientTickets,
          totalTickets: ts.totalTickets,
          bg: BG.general,
        });
      } else if (widgetType === "tickets_into_work") {
        const tiw = ticketsIntoWorkFrom(D.general);
        W.push({
          id: "general",
          type: "tickets_into_work",
          title: getLanguageByKey("Tickets taken into work"),
          subtitle: getLanguageByKey("All company"),
          takenIntoWorkTickets: tiw.takenIntoWorkTickets,
          bg: BG.general,
        });
      } else if (widgetType === "system_usage") {
        const su = systemUsageFrom(D.general);
        W.push({
          id: "general",
          type: "system_usage",
          title: getLanguageByKey("System usage"),
          subtitle: getLanguageByKey("All company"),
          activityMinutes: su.activityMinutes,
          activityHours: su.activityHours,
          bg: BG.general,
        });
      } else if (widgetType === "ticket_distribution") {
        const td = ticketDistributionFrom(D.general);
        W.push({
          id: "general",
          type: "ticket_distribution",
          title: getLanguageByKey("Ticket Distribution"),
          subtitle: getLanguageByKey("All company"),
          distributedTickets: td.distributedTickets,
          bg: BG.general,
        });
      } else if (widgetType === "closed_tickets_count") {
        const ctc = closedTicketsCountFrom(D.general);
        W.push({
          id: "general",
          type: "closed_tickets_count",
          title: getLanguageByKey("Closed Tickets Count"),
          subtitle: getLanguageByKey("All company"),
          olderThan11Days: ctc.olderThan11Days,
          newerThan11Days: ctc.newerThan11Days,
          totalClosedTickets: ctc.totalClosedTickets,
          bg: BG.general,
        });
      } else if (widgetType === "tickets_by_depart_count") {
        const tbdc = ticketsByDepartCountFrom(D.general);
        W.push({
          id: "general",
          type: "tickets_by_depart_count",
          title: getLanguageByKey("Tickets By Depart Count"),
          subtitle: getLanguageByKey("All company"),
          lessThan14Days: tbdc.lessThan14Days,
          between14And30Days: tbdc.between14And30Days,
          moreThan30Days: tbdc.moreThan30Days,
          totalTickets: tbdc.totalTickets,
          bg: BG.general,
        });
      } else if (widgetType === "ticket_lifetime_stats") {
        const tls = ticketLifetimeStatsFrom(D.general);
        W.push({
          id: "general",
          type: "ticket_lifetime_stats",
          title: getLanguageByKey("Ticket Lifetime Stats"),
          subtitle: getLanguageByKey("All company"),
          totalLifetimeMinutes: tls.totalLifetimeMinutes,
          averageLifetimeMinutes: tls.averageLifetimeMinutes,
          ticketsProcessed: tls.ticketsProcessed,
          totalLifetimeHours: tls.totalLifetimeHours,
          averageLifetimeHours: tls.averageLifetimeHours,
          bg: BG.general,
        });
      } else if (widgetType === "ticket_rate") {
        const tr = ticketRateFrom(D.general);
        W.push({
          id: "general",
          type: "ticket_rate",
          title: getLanguageByKey("Ticket Rate"),
          subtitle: getLanguageByKey("All company"),
          totalTransitions: tr.totalTransitions,
          directlyClosedCount: tr.directlyClosedCount,
          directlyClosedPercentage: tr.directlyClosedPercentage,
          workedOnCount: tr.workedOnCount,
          workedOnPercentage: tr.workedOnPercentage,
          bg: BG.general,
        });
      } else if (widgetType === "workflow_from_change") {
        const wfc = workflowFromChangeFrom(D.general);
        W.push({
          id: "general",
          type: "workflow_from_change",
          title: getLanguageByKey("Workflow From Change"),
          subtitle: getLanguageByKey("All company"),
          luatInLucruChangedCount: wfc.luatInLucruChangedCount,
          ofertaTrimisaChangedCount: wfc.ofertaTrimisaChangedCount,
          totalChanges: wfc.totalChanges,
          bg: BG.general,
        });
      } else if (widgetType === "workflow_to_change") {
        const wtc = workflowToChangeFrom(D.general);
        W.push({
          id: "general",
          type: "workflow_to_change",
          title: getLanguageByKey("Workflow Change To"),
          subtitle: getLanguageByKey("All company"),
          contractIncheiatChangedCount: wtc.contractIncheiatChangedCount,
          bg: BG.general,
        });
      } else if (widgetType === "ticket_creation") {
        const tc = ticketCreationFrom(D.general);
        W.push({
          id: "general",
          type: "ticket_creation",
          title: getLanguageByKey("Ticket Creation"),
          subtitle: getLanguageByKey("All company"),
          ticketsCreatedCount: tc.ticketsCreatedCount,
          bg: BG.general,
        });
      } else if (widgetType === "workflow_from_de_prelucrat") {
        const wfdp = workflowFromDePrelucratFrom(D.general);
        W.push({
          id: "general",
          type: "workflow_from_de_prelucrat",
          title: getLanguageByKey("Workflow From De Prelucrat"),
          subtitle: getLanguageByKey("All company"),
          workflowChanges: wfdp.workflowChanges,
          totalChanges: wfdp.totalChanges,
          bg: BG.general,
        });
      } else if (widgetType === "workflow_duration") {
        const wd = workflowDurationFrom(D.general);
        W.push({
          id: "general",
          type: "workflow_duration",
          title: getLanguageByKey("Workflow Duration"),
          subtitle: getLanguageByKey("All company"),
          totalDurationMinutes: wd.totalDurationMinutes,
          averageDurationMinutes: wd.averageDurationMinutes,
          ticketsProcessed: wd.ticketsProcessed,
          bg: BG.general,
        });
      } else if (widgetType === "ticket_destination") {
        const td = ticketDestinationFrom(D.general);
        W.push({
          id: "general",
          type: "ticket_destination",
          title: getLanguageByKey("Ticket Destination"),
          subtitle: getLanguageByKey("All company"),
          destinationData: td,
          bg: BG.general,
        });
      } else {
      const c = countsFrom(D.general);
      W.push({
        id: "general",
        type: "general",
        title: widgetType === "messages" ? getLanguageByKey("Total messages for the period") : getLanguageByKey("Total calls for the period"),
        subtitle: getLanguageByKey("All company"),
        incoming: c.incoming,
        outgoing: c.outgoing,
        total: c.total,
        bg: BG.general,
      });
      }
    }

    // By group title
    const byGt = safeArray(D.by_group_title);
    byGt.forEach((r, idx) => {
      const name = r.group_title_name ?? r.group_title ?? r.group ?? "-";
      if (widgetType === "ticket_state") {
        const ts = ticketStateFrom(r);
        W.push({
          id: `gt-${name ?? idx}`,
          type: "ticket_state",
          title: getLanguageByKey("Group title"),
          subtitle: name || "-",
          oldClientTickets: ts.oldClientTickets,
          newClientTickets: ts.newClientTickets,
          totalTickets: ts.totalTickets,
          bg: BG.by_group_title,
        });
      } else if (widgetType === "tickets_into_work") {
        const tiw = ticketsIntoWorkFrom(r);
        W.push({
          id: `gt-${name ?? idx}`,
          type: "tickets_into_work",
          title: getLanguageByKey("Group title"),
          subtitle: name || "-",
          takenIntoWorkTickets: tiw.takenIntoWorkTickets,
          bg: BG.by_group_title,
        });
      } else if (widgetType === "system_usage") {
        const su = systemUsageFrom(r);
        W.push({
          id: `gt-${name ?? idx}`,
          type: "system_usage",
          title: getLanguageByKey("Group title"),
          subtitle: name || "-",
          activityMinutes: su.activityMinutes,
          activityHours: su.activityHours,
          bg: BG.by_group_title,
        });
      } else if (widgetType === "ticket_distribution") {
        const td = ticketDistributionFrom(r);
        W.push({
          id: `gt-${name ?? idx}`,
          type: "ticket_distribution",
          title: getLanguageByKey("Group title"),
          subtitle: name || "-",
          distributedTickets: td.distributedTickets,
          bg: BG.by_group_title,
        });
      } else if (widgetType === "closed_tickets_count") {
        const ctc = closedTicketsCountFrom(r);
        W.push({
          id: `gt-${name ?? idx}`,
          type: "closed_tickets_count",
          title: getLanguageByKey("Group title"),
          subtitle: name || "-",
          olderThan11Days: ctc.olderThan11Days,
          newerThan11Days: ctc.newerThan11Days,
          totalClosedTickets: ctc.totalClosedTickets,
          bg: BG.by_group_title,
        });
      } else if (widgetType === "tickets_by_depart_count") {
        const tbdc = ticketsByDepartCountFrom(r);
        W.push({
          id: `gt-${name ?? idx}`,
          type: "tickets_by_depart_count",
          title: getLanguageByKey("Group title"),
          subtitle: name || "-",
          lessThan14Days: tbdc.lessThan14Days,
          between14And30Days: tbdc.between14And30Days,
          moreThan30Days: tbdc.moreThan30Days,
          totalTickets: tbdc.totalTickets,
          bg: BG.by_group_title,
        });
      } else if (widgetType === "ticket_lifetime_stats") {
        const tls = ticketLifetimeStatsFrom(r);
        W.push({
          id: `gt-${name ?? idx}`,
          type: "ticket_lifetime_stats",
          title: getLanguageByKey("Group title"),
          subtitle: name || "-",
          totalLifetimeMinutes: tls.totalLifetimeMinutes,
          averageLifetimeMinutes: tls.averageLifetimeMinutes,
          ticketsProcessed: tls.ticketsProcessed,
          totalLifetimeHours: tls.totalLifetimeHours,
          averageLifetimeHours: tls.averageLifetimeHours,
          bg: BG.by_group_title,
        });
      } else if (widgetType === "ticket_rate") {
        const tr = ticketRateFrom(r);
        W.push({
          id: `gt-${name ?? idx}`,
          type: "ticket_rate",
          title: getLanguageByKey("Group title"),
          subtitle: name || "-",
          totalTransitions: tr.totalTransitions,
          directlyClosedCount: tr.directlyClosedCount,
          directlyClosedPercentage: tr.directlyClosedPercentage,
          workedOnCount: tr.workedOnCount,
          workedOnPercentage: tr.workedOnPercentage,
          bg: BG.by_group_title,
        });
      } else if (widgetType === "workflow_from_change") {
        const wfc = workflowFromChangeFrom(r);
        W.push({
          id: `gt-${name ?? idx}`,
          type: "workflow_from_change",
          title: getLanguageByKey("Group title"),
          subtitle: name || "-",
          luatInLucruChangedCount: wfc.luatInLucruChangedCount,
          ofertaTrimisaChangedCount: wfc.ofertaTrimisaChangedCount,
          totalChanges: wfc.totalChanges,
          bg: BG.by_group_title,
        });
      } else if (widgetType === "workflow_to_change") {
        const wtc = workflowToChangeFrom(r);
        W.push({
          id: `gt-${name ?? idx}`,
          type: "workflow_to_change",
          title: getLanguageByKey("Group title"),
          subtitle: name || "-",
          contractIncheiatChangedCount: wtc.contractIncheiatChangedCount,
          bg: BG.by_group_title,
        });
      } else if (widgetType === "ticket_creation") {
        const tc = ticketCreationFrom(r);
        W.push({
          id: `gt-${name ?? idx}`,
          type: "ticket_creation",
          title: getLanguageByKey("Group title"),
          subtitle: name || "-",
          ticketsCreatedCount: tc.ticketsCreatedCount,
          bg: BG.by_group_title,
        });
      } else if (widgetType === "workflow_from_de_prelucrat") {
        const wfdp = workflowFromDePrelucratFrom(r);
        W.push({
          id: `gt-${name ?? idx}`,
          type: "workflow_from_de_prelucrat",
          title: getLanguageByKey("Group title"),
          subtitle: name || "-",
          workflowChanges: wfdp.workflowChanges,
          totalChanges: wfdp.totalChanges,
          bg: BG.by_group_title,
        });
      } else if (widgetType === "workflow_duration") {
        const wd = workflowDurationFrom(r);
        W.push({
          id: `gt-${name ?? idx}`,
          type: "workflow_duration",
          title: getLanguageByKey("Group title"),
          subtitle: name || "-",
          totalDurationMinutes: wd.totalDurationMinutes,
          averageDurationMinutes: wd.averageDurationMinutes,
          ticketsProcessed: wd.ticketsProcessed,
          bg: BG.by_group_title,
        });
      } else {
        const c = countsFrom(r);
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
      }
    });

    // By user group
    const byUserGroup = safeArray(D.by_user_group);
    byUserGroup.forEach((r, idx) => {
      const name = r.user_group_name ?? r.user_group ?? r.group ?? "-";
      if (widgetType === "ticket_state") {
        const ts = ticketStateFrom(r);
        W.push({
          id: `ug-${idx}`,
          type: "ticket_state",
          title: getLanguageByKey("User group"),
          subtitle: name || "-",
          oldClientTickets: ts.oldClientTickets,
          newClientTickets: ts.newClientTickets,
          totalTickets: ts.totalTickets,
          bg: BG.by_user_group,
        });
      } else if (widgetType === "tickets_into_work") {
        const tiw = ticketsIntoWorkFrom(r);
        W.push({
          id: `ug-${idx}`,
          type: "tickets_into_work",
          title: getLanguageByKey("User group"),
          subtitle: name || "-",
          takenIntoWorkTickets: tiw.takenIntoWorkTickets,
          bg: BG.by_user_group,
        });
      } else if (widgetType === "system_usage") {
        const su = systemUsageFrom(r);
        W.push({
          id: `ug-${idx}`,
          type: "system_usage",
          title: getLanguageByKey("User group"),
          subtitle: name || "-",
          activityMinutes: su.activityMinutes,
          activityHours: su.activityHours,
          bg: BG.by_user_group,
        });
      } else if (widgetType === "ticket_distribution") {
        const td = ticketDistributionFrom(r);
        W.push({
          id: `ug-${idx}`,
          type: "ticket_distribution",
          title: getLanguageByKey("User group"),
          subtitle: name || "-",
          distributedTickets: td.distributedTickets,
          bg: BG.by_user_group,
        });
      } else if (widgetType === "closed_tickets_count") {
        const ctc = closedTicketsCountFrom(r);
        W.push({
          id: `ug-${idx}`,
          type: "closed_tickets_count",
          title: getLanguageByKey("User group"),
          subtitle: name || "-",
          olderThan11Days: ctc.olderThan11Days,
          newerThan11Days: ctc.newerThan11Days,
          totalClosedTickets: ctc.totalClosedTickets,
          bg: BG.by_user_group,
        });
      } else if (widgetType === "tickets_by_depart_count") {
        const tbdc = ticketsByDepartCountFrom(r);
        W.push({
          id: `ug-${idx}`,
          type: "tickets_by_depart_count",
          title: getLanguageByKey("User group"),
          subtitle: name || "-",
          lessThan14Days: tbdc.lessThan14Days,
          between14And30Days: tbdc.between14And30Days,
          moreThan30Days: tbdc.moreThan30Days,
          totalTickets: tbdc.totalTickets,
          bg: BG.by_user_group,
        });
      } else if (widgetType === "ticket_lifetime_stats") {
        const tls = ticketLifetimeStatsFrom(r);
        W.push({
          id: `ug-${idx}`,
          type: "ticket_lifetime_stats",
          title: getLanguageByKey("User group"),
          subtitle: name || "-",
          totalLifetimeMinutes: tls.totalLifetimeMinutes,
          averageLifetimeMinutes: tls.averageLifetimeMinutes,
          ticketsProcessed: tls.ticketsProcessed,
          totalLifetimeHours: tls.totalLifetimeHours,
          averageLifetimeHours: tls.averageLifetimeHours,
          bg: BG.by_user_group,
        });
      } else if (widgetType === "ticket_rate") {
        const tr = ticketRateFrom(r);
        W.push({
          id: `ug-${idx}`,
          type: "ticket_rate",
          title: getLanguageByKey("User group"),
          subtitle: name || "-",
          totalTransitions: tr.totalTransitions,
          directlyClosedCount: tr.directlyClosedCount,
          directlyClosedPercentage: tr.directlyClosedPercentage,
          workedOnCount: tr.workedOnCount,
          workedOnPercentage: tr.workedOnPercentage,
          bg: BG.by_user_group,
        });
      } else if (widgetType === "workflow_from_change") {
        const wfc = workflowFromChangeFrom(r);
        W.push({
          id: `ug-${idx}`,
          type: "workflow_from_change",
          title: getLanguageByKey("User group"),
          subtitle: name || "-",
          luatInLucruChangedCount: wfc.luatInLucruChangedCount,
          ofertaTrimisaChangedCount: wfc.ofertaTrimisaChangedCount,
          totalChanges: wfc.totalChanges,
          bg: BG.by_user_group,
        });
      } else if (widgetType === "workflow_to_change") {
        const wtc = workflowToChangeFrom(r);
        W.push({
          id: `ug-${idx}`,
          type: "workflow_to_change",
          title: getLanguageByKey("User group"),
          subtitle: name || "-",
          contractIncheiatChangedCount: wtc.contractIncheiatChangedCount,
          bg: BG.by_user_group,
        });
      } else if (widgetType === "ticket_creation") {
        const tc = ticketCreationFrom(r);
        W.push({
          id: `ug-${idx}`,
          type: "ticket_creation",
          title: getLanguageByKey("User group"),
          subtitle: name || "-",
          ticketsCreatedCount: tc.ticketsCreatedCount,
          bg: BG.by_user_group,
        });
      } else if (widgetType === "workflow_from_de_prelucrat") {
        const wfdp = workflowFromDePrelucratFrom(r);
        W.push({
          id: `ug-${idx}`,
          type: "workflow_from_de_prelucrat",
          title: getLanguageByKey("User group"),
          subtitle: name || "-",
          workflowChanges: wfdp.workflowChanges,
          totalChanges: wfdp.totalChanges,
          bg: BG.by_user_group,
        });
      } else if (widgetType === "workflow_duration") {
        const wd = workflowDurationFrom(r);
        W.push({
          id: `ug-${idx}`,
          type: "workflow_duration",
          title: getLanguageByKey("User group"),
          subtitle: name || "-",
          totalDurationMinutes: wd.totalDurationMinutes,
          averageDurationMinutes: wd.averageDurationMinutes,
          ticketsProcessed: wd.ticketsProcessed,
          bg: BG.by_user_group,
        });
      } else {
        const c = countsFrom(r);
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
      }
    });

    // By user
    const byUser = safeArray(D.by_user);
    byUser.forEach((r, idx) => {
      const uid = Number(r.user_id);
      const name = userNameById.get(uid);
      const subtitle = (name || (Number.isFinite(uid) ? `ID ${uid}` : "-")) + (r.sipuni_id ? ` • ${r.sipuni_id}` : "");
      if (widgetType === "ticket_state") {
        const ts = ticketStateFrom(r);
        W.push({
          id: `user-${uid || idx}`,
          type: "ticket_state",
          title: getLanguageByKey("User"),
          subtitle,
          oldClientTickets: ts.oldClientTickets,
          newClientTickets: ts.newClientTickets,
          totalTickets: ts.totalTickets,
          bg: BG.by_user,
        });
      } else if (widgetType === "tickets_into_work") {
        const tiw = ticketsIntoWorkFrom(r);
        W.push({
          id: `user-${uid || idx}`,
          type: "tickets_into_work",
          title: getLanguageByKey("User"),
          subtitle,
          takenIntoWorkTickets: tiw.takenIntoWorkTickets,
          bg: BG.by_user,
        });
      } else if (widgetType === "system_usage") {
        const su = systemUsageFrom(r);
        W.push({
          id: `user-${uid || idx}`,
          type: "system_usage",
          title: getLanguageByKey("User"),
          subtitle,
          activityMinutes: su.activityMinutes,
          activityHours: su.activityHours,
          bg: BG.by_user,
        });
      } else if (widgetType === "ticket_distribution") {
        const td = ticketDistributionFrom(r);
        W.push({
          id: `user-${uid || idx}`,
          type: "ticket_distribution",
          title: getLanguageByKey("User"),
          subtitle,
          distributedTickets: td.distributedTickets,
          bg: BG.by_user,
        });
      } else if (widgetType === "closed_tickets_count") {
        const ctc = closedTicketsCountFrom(r);
        W.push({
          id: `user-${uid || idx}`,
          type: "closed_tickets_count",
          title: getLanguageByKey("User"),
          subtitle,
          olderThan11Days: ctc.olderThan11Days,
          newerThan11Days: ctc.newerThan11Days,
          totalClosedTickets: ctc.totalClosedTickets,
          bg: BG.by_user,
        });
      } else if (widgetType === "tickets_by_depart_count") {
        const tbdc = ticketsByDepartCountFrom(r);
        W.push({
          id: `user-${uid || idx}`,
          type: "tickets_by_depart_count",
          title: getLanguageByKey("User"),
          subtitle,
          lessThan14Days: tbdc.lessThan14Days,
          between14And30Days: tbdc.between14And30Days,
          moreThan30Days: tbdc.moreThan30Days,
          totalTickets: tbdc.totalTickets,
          bg: BG.by_user,
        });
      } else if (widgetType === "ticket_lifetime_stats") {
        const tls = ticketLifetimeStatsFrom(r);
        W.push({
          id: `user-${uid || idx}`,
          type: "ticket_lifetime_stats",
          title: getLanguageByKey("User"),
          subtitle,
          totalLifetimeMinutes: tls.totalLifetimeMinutes,
          averageLifetimeMinutes: tls.averageLifetimeMinutes,
          ticketsProcessed: tls.ticketsProcessed,
          totalLifetimeHours: tls.totalLifetimeHours,
          averageLifetimeHours: tls.averageLifetimeHours,
          bg: BG.by_user,
        });
      } else if (widgetType === "ticket_rate") {
        const tr = ticketRateFrom(r);
        W.push({
          id: `user-${uid || idx}`,
          type: "ticket_rate",
          title: getLanguageByKey("User"),
          subtitle,
          totalTransitions: tr.totalTransitions,
          directlyClosedCount: tr.directlyClosedCount,
          directlyClosedPercentage: tr.directlyClosedPercentage,
          workedOnCount: tr.workedOnCount,
          workedOnPercentage: tr.workedOnPercentage,
          bg: BG.by_user,
        });
      } else if (widgetType === "workflow_from_change") {
        const wfc = workflowFromChangeFrom(r);
        W.push({
          id: `user-${uid || idx}`,
          type: "workflow_from_change",
          title: getLanguageByKey("User"),
          subtitle,
          luatInLucruChangedCount: wfc.luatInLucruChangedCount,
          ofertaTrimisaChangedCount: wfc.ofertaTrimisaChangedCount,
          totalChanges: wfc.totalChanges,
          bg: BG.by_user,
        });
      } else if (widgetType === "workflow_to_change") {
        const wtc = workflowToChangeFrom(r);
        W.push({
          id: `user-${uid || idx}`,
          type: "workflow_to_change",
          title: getLanguageByKey("User"),
          subtitle,
          contractIncheiatChangedCount: wtc.contractIncheiatChangedCount,
          bg: BG.by_user,
        });
      } else if (widgetType === "ticket_creation") {
        const tc = ticketCreationFrom(r);
        W.push({
          id: `user-${uid || idx}`,
          type: "ticket_creation",
          title: getLanguageByKey("User"),
          subtitle,
          ticketsCreatedCount: tc.ticketsCreatedCount,
          bg: BG.by_user,
        });
      } else if (widgetType === "workflow_from_de_prelucrat") {
        const wfdp = workflowFromDePrelucratFrom(r);
        W.push({
          id: `user-${uid || idx}`,
          type: "workflow_from_de_prelucrat",
          title: getLanguageByKey("User"),
          subtitle,
          workflowChanges: wfdp.workflowChanges,
          totalChanges: wfdp.totalChanges,
          bg: BG.by_user,
        });
      } else if (widgetType === "workflow_duration") {
        const wd = workflowDurationFrom(r);
        W.push({
          id: `user-${uid || idx}`,
          type: "workflow_duration",
          title: getLanguageByKey("User"),
          subtitle,
          totalDurationMinutes: wd.totalDurationMinutes,
          averageDurationMinutes: wd.averageDurationMinutes,
          ticketsProcessed: wd.ticketsProcessed,
          bg: BG.by_user,
        });
      } else {
        const c = countsFrom(r);
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
      }
    });

    // Топ пользователей (по total по убыванию)
    if (byUser.length) {
      const rows = byUser.map((r) => {
        const uid = Number(r.user_id);
        if (widgetType === "ticket_state") {
          const ts = ticketStateFrom(r);
          return {
            user_id: uid,
            name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
            sipuni_id: r.sipuni_id,
            oldClientTickets: ts.oldClientTickets,
            newClientTickets: ts.newClientTickets,
            total: ts.totalTickets,
          };
        } else if (widgetType === "tickets_into_work") {
          const tiw = ticketsIntoWorkFrom(r);
          return {
            user_id: uid,
            name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
            sipuni_id: r.sipuni_id,
            takenIntoWorkTickets: tiw.takenIntoWorkTickets,
            total: tiw.takenIntoWorkTickets,
          };
        } else if (widgetType === "system_usage") {
          const su = systemUsageFrom(r);
          return {
            user_id: uid,
            name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
            sipuni_id: r.sipuni_id,
            activityMinutes: su.activityMinutes,
            activityHours: su.activityHours,
            total: su.activityHours,
          };
        } else if (widgetType === "ticket_distribution") {
          const td = ticketDistributionFrom(r);
          return {
            user_id: uid,
            name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
            sipuni_id: r.sipuni_id,
            distributedTickets: td.distributedTickets,
            total: td.distributedTickets,
          };
        } else if (widgetType === "closed_tickets_count") {
          const ctc = closedTicketsCountFrom(r);
          return {
            user_id: uid,
            name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
            sipuni_id: r.sipuni_id,
            olderThan11Days: ctc.olderThan11Days,
            newerThan11Days: ctc.newerThan11Days,
            totalClosedTickets: ctc.totalClosedTickets,
            total: ctc.totalClosedTickets,
          };
        } else if (widgetType === "tickets_by_depart_count") {
          const tbdc = ticketsByDepartCountFrom(r);
          return {
            user_id: uid,
            name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
            sipuni_id: r.sipuni_id,
            lessThan14Days: tbdc.lessThan14Days,
            between14And30Days: tbdc.between14And30Days,
            moreThan30Days: tbdc.moreThan30Days,
            totalTickets: tbdc.totalTickets,
            total: tbdc.totalTickets,
          };
        } else if (widgetType === "ticket_lifetime_stats") {
          const tls = ticketLifetimeStatsFrom(r);
          return {
            user_id: uid,
            name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
            sipuni_id: r.sipuni_id,
            totalLifetimeMinutes: tls.totalLifetimeMinutes,
            averageLifetimeMinutes: tls.averageLifetimeMinutes,
            ticketsProcessed: tls.ticketsProcessed,
            totalLifetimeHours: tls.totalLifetimeHours,
            averageLifetimeHours: tls.averageLifetimeHours,
            total: tls.ticketsProcessed,
          };
        } else if (widgetType === "ticket_rate") {
          const tr = ticketRateFrom(r);
          return {
            user_id: uid,
            name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
            sipuni_id: r.sipuni_id,
            totalTransitions: tr.totalTransitions,
            directlyClosedCount: tr.directlyClosedCount,
            directlyClosedPercentage: tr.directlyClosedPercentage,
            workedOnCount: tr.workedOnCount,
            workedOnPercentage: tr.workedOnPercentage,
            total: tr.totalTransitions,
          };
        } else if (widgetType === "workflow_from_change") {
          const wfc = workflowFromChangeFrom(r);
          return {
            user_id: uid,
            name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
            sipuni_id: r.sipuni_id,
            luatInLucruChangedCount: wfc.luatInLucruChangedCount,
            ofertaTrimisaChangedCount: wfc.ofertaTrimisaChangedCount,
            totalChanges: wfc.totalChanges,
            total: wfc.totalChanges,
          };
        } else if (widgetType === "workflow_to_change") {
          const wtc = workflowToChangeFrom(r);
          return {
            user_id: uid,
            name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
            sipuni_id: r.sipuni_id,
            contractIncheiatChangedCount: wtc.contractIncheiatChangedCount,
            total: wtc.contractIncheiatChangedCount,
          };
        } else if (widgetType === "ticket_creation") {
          const tc = ticketCreationFrom(r);
          return {
            user_id: uid,
            name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
            sipuni_id: r.sipuni_id,
            ticketsCreatedCount: tc.ticketsCreatedCount,
            total: tc.ticketsCreatedCount,
          };
        } else if (widgetType === "workflow_from_de_prelucrat") {
          const wfdp = workflowFromDePrelucratFrom(r);
          return {
            user_id: uid,
            name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
            sipuni_id: r.sipuni_id,
            totalChanges: wfdp.totalChanges,
            total: wfdp.totalChanges,
          };
        } else if (widgetType === "workflow_duration") {
          const wd = workflowDurationFrom(r);
          return {
            user_id: uid,
            name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
            sipuni_id: r.sipuni_id,
            averageDurationMinutes: wd.averageDurationMinutes,
            total: wd.averageDurationMinutes,
          };
        } else {
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          incoming: Number(r.incoming_calls_count) || 0,
          outgoing: Number(r.outgoing_calls_count) || 0,
          total: Number(r.total_calls_count) || 0,
        };
        }
      });
      W.push({
        id: "top-users",
        type: "top_users",
        title: getLanguageByKey("Top users"),
        subtitle: getLanguageByKey("By total (desc)"),
        rows,
        bg: BG.by_user,
        widgetType, // Передаем тип виджета
      });
    }

    // By platform (для messages)
    if (widgetType === "messages") {
      const platforms = mapPlatforms(D.by_platform);
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

    // By source (для calls — если бэк вернёт)
    const bySrc = safeArray(D.by_source);
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

    return W;
  }, [rawData, userNameById, widgetType, countsFrom, systemUsageFrom, ticketDistributionFrom, ticketStateFrom, ticketsIntoWorkFrom, closedTicketsCountFrom, ticketsByDepartCountFrom, ticketLifetimeStatsFrom, ticketRateFrom, workflowFromChangeFrom, workflowToChangeFrom, ticketCreationFrom, workflowFromDePrelucratFrom, workflowDurationFrom, ticketDestinationFrom]);

  const handleApplyFilter = useCallback((payload, meta) => {
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
