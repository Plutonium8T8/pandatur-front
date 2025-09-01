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
// важно: это твой новый компонент с тонкой сеткой (ResponsiveGridLayout внутри)
import DashboardGrid from "../Components/DashboardComponent/DashboardGrid";
// если ты рендеришь TotalCard прямо в Grid — импортируй его там
import { TotalCard } from "../Components/DashboardComponent/TotalCard";

const safeArray = (a) => (Array.isArray(a) ? a : []);
const pickIds = (arr) => safeArray(arr).map((x) => Number(x?.value ?? x)).filter((n) => Number.isFinite(n));

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
    if (!payload.attributes?.timestamp?.from && !payload.attributes?.timestamp?.to) delete payload.attributes;
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

  // собираем виджеты с типами для грид-компонента (general/group/user/source/gt)
  const widgets = useMemo(() => {
    const W = [];

    if (callsData?.general) {
      W.push({
        id: "general",
        type: "general",
        title: getLanguageByKey("Total calls for the period"),
        subtitle: getLanguageByKey("All company"),
        incoming: Number(callsData.general.incoming_calls_count) || 0,
        outgoing: Number(callsData.general.outgoing_calls_count) || 0,
        total: Number(callsData.general.total_calls_count) || 0,
      });
    }

    safeArray(callsData?.by_user_group).forEach((r, idx) => {
      W.push({
        id: `ug-${idx}`,
        type: "group",
        title: getLanguageByKey("User group"),
        subtitle: r.user_group_name || "-",
        incoming: Number(r.incoming_calls_count) || 0,
        outgoing: Number(r.outgoing_calls_count) || 0,
        total: Number(r.total_calls_count) || 0,
      });
    });

    safeArray(callsData?.by_user).forEach((r, idx) => {
      W.push({
        id: `user-${r.user_id ?? idx}`,
        type: "user",
        title: getLanguageByKey("User"),
        subtitle: String(r.user_id ?? "-") + (r.sipuni_id ? ` • ${r.sipuni_id}` : ""),
        incoming: Number(r.incoming_calls_count) || 0,
        outgoing: Number(r.outgoing_calls_count) || 0,
        total: Number(r.total_calls_count) || 0,
      });
    });

    safeArray(callsData?.by_group_title).forEach((r, idx) => {
      W.push({
        id: `gt-${r.group_title_name ?? idx}`,
        type: "group", // или свой тип "gt", если в DashboardGrid есть размеры под него
        title: getLanguageByKey("Group title"),
        subtitle: r.group_title_name || "-",
        incoming: Number(r.incoming_calls_count) || 0,
        outgoing: Number(r.outgoing_calls_count) || 0,
        total: Number(r.total_calls_count) || 0,
      });
    });

    safeArray(callsData?.by_source).forEach((r, idx) => {
      W.push({
        id: `src-${r.source ?? idx}`,
        type: "source",
        title: getLanguageByKey("Source"),
        subtitle: r.source || "-",
        incoming: Number(r.incoming_calls_count) || 0,
        outgoing: Number(r.outgoing_calls_count) || 0,
        total: Number(r.total_calls_count) || 0,
      });
    });

    return W;
  }, [callsData]);

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
          {/* твой компонент с тонкой сеткой */}
          <DashboardGrid widgets={widgets} />
        </Box>
      )}
    </Stack>
  );
};
