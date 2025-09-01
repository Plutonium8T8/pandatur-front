import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { format } from "date-fns";
import { useSnackbar } from "notistack";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Flex, Text, Box, Stack } from "@mantine/core";
import { api } from "../api";
import { Filter } from "../Components/DashboardComponent/Filter/Filter";
import { showServerError, getLanguageByKey } from "@utils";
import { Spin, PageHeader } from "@components";
import DashboardGrid from "../Components/DashboardComponent/DashboardGrid";
import { useGetTechniciansList } from "../hooks";

const safeArray = (a) => (Array.isArray(a) ? a : []);
const pickIds = (arr) =>
  safeArray(arr).map((x) => Number(x?.value ?? x)).filter((n) => Number.isFinite(n));

/** цвета фона по типам группировок */
const BG = {
  general: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(16,185,129,0.15))",
  by_user_group: "linear-gradient(135deg, rgba(147,51,234,0.14), rgba(59,130,246,0.14))",
  by_user: "linear-gradient(135deg, rgba(59,130,246,0.14), rgba(34,197,94,0.14))",
  by_group_title: "linear-gradient(135deg, rgba(245,158,11,0.16), rgba(48, 23, 27, 0.12))",
  by_source: "linear-gradient(135deg, rgba(34,197,94,0.14), rgba(34,211,238,0.14))",
};

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(400);

  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [selectedUserGroups, setSelectedUserGroups] = useState([]);
  const [selectedGroupTitles, setSelectedGroupTitles] = useState([]);
  const [dateRange, setDateRange] = useState([]);

  const { enqueueSnackbar } = useSnackbar();

  const headerRowRef = useRef(null);
  const scrollRef = useRef(null);
  const requestIdRef = useRef(0);

  const [callsData, setCallsData] = useState(null);
  const [callsError, setCallsError] = useState(null);

  // имена по user_id
  const { technicians } = useGetTechniciansList(); // [{ value, label }, ...]
  const userNameById = useMemo(() => {
    const map = new Map();
    safeArray(technicians).forEach((t) => {
      const id = Number(t?.value);
      const name = String(t?.label ?? "").trim();
      if (Number.isFinite(id) && name) map.set(id, name);
    });
    return map;
  }, [technicians]);

  const buildCallsPayload = useCallback(() => {
    const [start, end] = dateRange || [];
    const payload = {
      user_ids: pickIds(selectedTechnicians),
      user_groups: selectedUserGroups?.length ? selectedUserGroups : undefined,
      group_titles: selectedGroupTitles?.length ? selectedGroupTitles : undefined,
      attributes:
        start || end
          ? {
            timestamp: {
              from: start ? format(start, "yyyy-MM-dd") : undefined,
              to: end ? format(end, "yyyy-MM-dd") : undefined,
            },
          }
          : undefined,
    };
    if (!payload.user_ids?.length) delete payload.user_ids;
    if (!payload.user_groups?.length) delete payload.user_groups;
    if (!payload.group_titles?.length) delete payload.group_titles;
    if (!payload.attributes?.timestamp?.from && !payload.attributes?.timestamp?.to)
      delete payload.attributes;
    return payload;
  }, [selectedTechnicians, selectedUserGroups, selectedGroupTitles, dateRange]);

  const fetchCallsStatic = useCallback(
    async (payload) => {
      const thisReqId = ++requestIdRef.current;
      setIsLoading(true);
      setCallsError(null);
      try {
        const res = await api.dashboard.getWidgetCalls(payload);
        if (requestIdRef.current !== thisReqId) return;
        setCallsData(res || null);
      } catch (e) {
        if (requestIdRef.current !== thisReqId) return;
        setCallsData(null);
        setCallsError(e?.message || String(e));
        enqueueSnackbar(showServerError(e), { variant: "error" });
      } finally {
        if (requestIdRef.current === thisReqId) setIsLoading(false);
      }
    },
    [enqueueSnackbar]
  );

  useEffect(() => {
    const [start, end] = dateRange || [];
    if (!!start !== !!end) return; // ждём полноценный диапазон
    fetchCallsStatic(buildCallsPayload());
  }, [buildCallsPayload, fetchCallsStatic]);

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

  // собираем виджеты + заголовки секций
  const widgets = useMemo(() => {
    const W = [];

    if (callsData?.general) {
      W.push({ id: "sep-general", type: "separator", label: getLanguageByKey("General") });
      W.push({
        id: "general",
        type: "general",
        title: getLanguageByKey("Total calls for the period"),
        subtitle: getLanguageByKey("All company"),
        incoming: Number(callsData.general.incoming_calls_count) || 0,
        outgoing: Number(callsData.general.outgoing_calls_count) || 0,
        total: Number(callsData.general.total_calls_count) || 0,
        bg: BG.general,
      });
    }

    if (safeArray(callsData?.by_user_group).length) {
      W.push({ id: "sep-ug", type: "separator", label: getLanguageByKey("By user group") });
      safeArray(callsData.by_user_group).forEach((r, idx) => {
        W.push({
          id: `ug-${idx}`,
          type: "group",
          title: getLanguageByKey("User group"),
          subtitle: r.user_group_name || "-",
          incoming: Number(r.incoming_calls_count) || 0,
          outgoing: Number(r.outgoing_calls_count) || 0,
          total: Number(r.total_calls_count) || 0,
          bg: BG.by_user_group,
        });
      });
    }

    if (safeArray(callsData?.by_user).length) {
      W.push({ id: "sep-user", type: "separator", label: getLanguageByKey("By user") });
      safeArray(callsData.by_user).forEach((r, idx) => {
        const uid = Number(r.user_id);
        const name = userNameById.get(uid);
        const subtitle =
          (name || (Number.isFinite(uid) ? `ID ${uid}` : "-")) +
          (r.sipuni_id ? ` • ${r.sipuni_id}` : "");
        W.push({
          id: `user-${uid || idx}`,
          type: "user",
          title: getLanguageByKey("User"),
          subtitle,
          incoming: Number(r.incoming_calls_count) || 0,
          outgoing: Number(r.outgoing_calls_count) || 0,
          total: Number(r.total_calls_count) || 0,
          bg: BG.by_user,
        });
      });
    }

    if (safeArray(callsData?.by_group_title).length) {
      W.push({ id: "sep-gt", type: "separator", label: getLanguageByKey("By group title") });
      safeArray(callsData.by_group_title).forEach((r, idx) => {
        W.push({
          id: `gt-${r.group_title_name ?? idx}`,
          type: "group",
          title: getLanguageByKey("Group title"),
          subtitle: r.group_title_name || "-",
          incoming: Number(r.incoming_calls_count) || 0,
          outgoing: Number(r.outgoing_calls_count) || 0,
          total: Number(r.total_calls_count) || 0,
          bg: BG.by_group_title,
        });
      });
    }

    if (safeArray(callsData?.by_source).length) {
      W.push({ id: "sep-src", type: "separator", label: getLanguageByKey("By source") });
      safeArray(callsData.by_source).forEach((r, idx) => {
        W.push({
          id: `src-${r.source ?? idx}`,
          type: "source",
          title: getLanguageByKey("Source"),
          subtitle: r.source || "-",
          incoming: Number(r.incoming_calls_count) || 0,
          outgoing: Number(r.outgoing_calls_count) || 0,
          total: Number(r.total_calls_count) || 0,
          bg: BG.by_source,
        });
      });
    }

    return W;
  }, [callsData, userNameById]);

  return (
    <Stack gap={12}>
      <Flex ref={headerRowRef} className="dashboard-header-container" p="md">
        <PageHeader
          title={getLanguageByKey("Dashboard")}
          extraInfo={
            <Filter
              onSelectedTechnicians={setSelectedTechnicians}
              onSelectedUserGroups={setSelectedUserGroups}
              onSelectedGroupTitles={setSelectedGroupTitles}
              onSelectDataRange={setDateRange}
              selectedTechnicians={selectedTechnicians}
              selectedUserGroups={selectedUserGroups}
              selectedGroupTitles={selectedGroupTitles}
              dateRange={dateRange}
            />
          }
        />
      </Flex>

      {isLoading ? (
        <Flex align="center" justify="center" style={{ flex: 1, minHeight: 240 }}>
          <Spin />
        </Flex>
      ) : callsError ? (
        <Flex align="center" justify="center" style={{ flex: 1, minHeight: 240 }}>
          <Text c="red">{String(callsError)}</Text>
        </Flex>
      ) : (
        <Box
          ref={scrollRef}
          style={{
            width: "100%",
            height: scrollHeight,
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: 8,
            scrollbarGutter: "stable",
          }}
        >
          <DashboardGrid widgets={widgets} dateRange={dateRange} />
        </Box>
      )}
    </Stack>
  );
};
