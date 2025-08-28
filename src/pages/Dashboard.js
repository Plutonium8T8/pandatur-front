import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { format } from "date-fns";
import { useSnackbar } from "notistack";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Flex, Card, Group, Badge, Text, Box, Stack } from "@mantine/core";
import { api } from "../api";
import { Filter } from "../Components/DashboardComponent/Filter/Filter";
import { showServerError, getLanguageByKey } from "@utils";
import { Spin, PageHeader } from "@components";
import { TotalCard } from "../Components/DashboardComponent/TotalCard";
import { StatBarList } from "../Components/DashboardComponent/StatBarList";
import { ScrollContainer } from "../Components/DashboardComponent/ScrollContainer";

const THRESHOLD = 47;

const TYPES = [
  "calls", "messages", "system_usage", "tickets_count", "distributor", "workflow_change",
  "ticket_create_count", "contract_closed", "ticket_lifetime", "contract_departure",
  "workflow_percentage", "workflow_duration", "country_count",
];

const safeArray = (a) => (Array.isArray(a) ? a : []);
const sum = (arr, key) => safeArray(arr).reduce((acc, x) => acc + (Number(x?.[key]) || 0), 0);
const pickIds = (arr) => safeArray(arr).map((x) => Number(x?.value ?? x)).filter((n) => Number.isFinite(n));

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(400);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [dateRange, setDateRange] = useState([]);
  const { enqueueSnackbar } = useSnackbar();

  const [selectedUserGroups, setSelectedUserGroups] = useState([]);
  const [selectedGroupTitles, setSelectedGroupTitles] = useState([]);

  const headerRowRef = useRef(null);
  const scrollRef = useRef(null);
  const requestIdRef = useRef(0);

  const [responses, setResponses] = useState(
    () => Object.fromEntries(TYPES.map((t) => [t, { data: null, error: null }]))
  );

  const calls = responses["calls"]?.data || {};
  const totalIncoming = Number(calls?.total?.incoming_calls) || 0;
  const totalOutgoing = Number(calls?.total?.outgoing_calls) || 0;
  const totalAll = totalIncoming + totalOutgoing;

  const topGroupTitles = useMemo(
    () =>
      [...safeArray(calls?.by_group_titles)]
        .sort((a, b) => (b.incoming_calls + b.outgoing_calls) - (a.incoming_calls + a.outgoing_calls))
        .slice(0, 6)
        .map((x) => ({ ...x, _sum: (x.incoming_calls || 0) + (x.outgoing_calls || 0) })),
    [calls?.by_group_titles]
  );

  const topUsers = useMemo(
    () =>
      [...safeArray(calls?.by_users)]
        .sort((a, b) => (b.incoming_calls + b.outgoing_calls) - (a.incoming_calls + a.outgoing_calls))
        .slice(0, 8)
        .map((x) => ({ ...x, _sum: (x.incoming_calls || 0) + (x.outgoing_calls || 0) })),
    [calls?.by_users]
  );

  const fetchAllTypes = useCallback(async ({ dateRange }) => {
    const [start, end] = dateRange;
    const user_ids = pickIds(selectedTechnicians);

    const attributes = {
      user_ids,
      ...(start || end
        ? {
          timestamp: {
            from: start ? format(start, "yyyy-MM-dd") : undefined,
            until: end ? format(end, "yyyy-MM-dd") : undefined,
          },
        }
        : {}),
    };

    const thisReqId = ++requestIdRef.current;
    setIsLoading(true);

    try {
      const results = await Promise.all(
        TYPES.map(async (type) => {
          try {
            const res = await api.dashboard.getAnalytics({ type, attributes });
            return { type, ok: true, res };
          } catch (e) {
            return { type, ok: false, err: e };
          }
        })
      );

      if (requestIdRef.current !== thisReqId) return;

      const next = Object.fromEntries(
        results.map((r) =>
          r.ok
            ? [r.type, { data: r.res || null, error: null }]
            : [r.type, { data: null, error: r.err?.message || String(r.err) }]
        )
      );

      setResponses(next);

      const errorsCount = results.filter((r) => !r.ok).length;
      if (errorsCount > 0) {
        enqueueSnackbar(`Часть запросов завершилась с ошибкой: ${errorsCount}/${TYPES.length}`, { variant: "warning" });
      }
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      if (requestIdRef.current === thisReqId) setIsLoading(false);
    }
  }, [selectedTechnicians, enqueueSnackbar]);

  const recalcSizes = useCallback(() => {
    const headerH = headerRowRef.current?.offsetHeight || 0;
    const margins = 24;
    const viewportH = window.innerHeight || 800;
    setScrollHeight(Math.max(240, viewportH - headerH - margins));
    if (scrollRef.current) setContainerWidth(Math.max(0, scrollRef.current.clientWidth - THRESHOLD));
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

  useEffect(() => {
    const [start, end] = dateRange;
    if (!!start !== !!end) return;
    fetchAllTypes({ dateRange });
  }, [fetchAllTypes, dateRange, selectedTechnicians]);

  const { cols, rowHeight } = useMemo(() => {
    const cols = containerWidth > 1400 ? 6 : 4;
    const rowHeight = containerWidth / cols + 50;
    return { cols, rowHeight };
  }, [containerWidth]);

  const baseLayout = useMemo(
    () => [
      { i: "a-total", x: 0, y: 0, w: 2, h: 1 },
      { i: "a-groups", x: 2, y: 0, w: 2, h: 2 },
      { i: "a-users", x: 4, y: 0, w: 2, h: 2 },
    ],
    []
  );

  const typesLayout = useMemo(() => {
    const w = 2;
    const h = 2;
    const perRow = Math.max(1, Math.floor(cols / w));
    const startY = 4;
    const arr = [];
    TYPES.forEach((t, idx) => {
      const col = idx % perRow;
      const row = Math.floor(idx / perRow);
      arr.push({ i: `t-${t}`, x: col * w, y: startY + row * h, w, h });
    });
    return arr;
  }, [cols]);

  const analyticsLayout = useMemo(() => [...baseLayout, ...typesLayout], [baseLayout, typesLayout]);

  const TypeCard = ({ type, data, error }) => {
    const hasError = !!error;
    return (
      <Card withBorder radius="lg" p="lg" h="100%" style={{ display: "flex", flexDirection: "column" }}>
        <Group justify="space-between" mb={8}>
          <Text fw={700} tt="uppercase">{type}</Text>
          <Badge color={hasError ? "red" : "green"} variant="light">
            {hasError ? "error" : "ok"}
          </Badge>
        </Group>
        <Box style={{ overflow: "auto", flex: 1 }}>
          <Text
            component="pre"
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              maxHeight: "100%",
              overflow: "auto",
              background: "rgba(0,0,0,0.03)",
              padding: 8,
              borderRadius: 8,
            }}
          >
            {hasError ? String(error) : JSON.stringify(data ?? null, null, 2)}
          </Text>
        </Box>
      </Card>
    );
  };

  return (
    <Stack gap={12}>
      <Flex
        ref={headerRowRef}
        className="dashboard-header-container"
        p={"md"}
      >
        <PageHeader
          title={getLanguageByKey("Dashboard")}
          // count={totalAll}
          extraInfo={
            <Filter
              onSelectedTechnicians={setSelectedTechnicians}
              onSelectedUserGroups={setSelectedUserGroups}     // НОВОЕ
              onSelectedGroupTitles={setSelectedGroupTitles}   // НОВОЕ
              onSelectDataRange={setDateRange}
              selectedTechnicians={selectedTechnicians}
              selectedUserGroups={selectedUserGroups}          // НОВОЕ
              selectedGroupTitles={selectedGroupTitles}        // НОВОЕ
              dateRange={dateRange}
            />
          }
        />
      </Flex>

      {isLoading ? (
        <Flex align="center" justify="center" style={{ flex: 1, minHeight: 240 }}>
          <Spin />
        </Flex>
      ) : (
        <ScrollContainer ref={scrollRef} height={scrollHeight}>
          <GridLayout
            layout={analyticsLayout}
            cols={cols}
            rowHeight={rowHeight}
            width={containerWidth}
            isResizable
            isDraggable
            compactType={null}
            preventCollision
          >
            <Box key="a-total">
              <TotalCard
                totalAll={totalAll}
                totalIncoming={totalIncoming}
                totalOutgoing={totalOutgoing}
                dateRange={dateRange}
              />
            </Box>

            <Box key="a-groups">
              <StatBarList
                title={getLanguageByKey("By Group Title")}
                items={topGroupTitles}
                total={sum(topGroupTitles, "_sum")}
                nameKey="group_title"
                valueKey="_sum"
              />
            </Box>

            <Box key="a-users">
              <StatBarList
                title={getLanguageByKey("Top users")}
                items={topUsers}
                total={sum(topUsers, "_sum")}
                nameKey="username"
                valueKey="_sum"
              />
            </Box>

            {TYPES.map((t) => {
              const item = responses[t] || { data: null, error: null };
              return (
                <Box key={`t-${t}`}>
                  <TypeCard type={t} data={item.data} error={item.error} />
                </Box>
              );
            })}
          </GridLayout>
        </ScrollContainer>
      )}
    </Stack>
  );
};
