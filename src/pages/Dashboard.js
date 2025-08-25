import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { format } from "date-fns";
import { useSnackbar } from "notistack";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Flex } from "@mantine/core";
import { useUser } from "@hooks";
import { api } from "@api";
import { Filter } from "@components/DashboardComponent/Filter";
import {
  chartsMetadata,
  metricsDashboardCharts,
  normalizeUserGraphs,
  renderChart,
  chartComponents,
  getLastItemId,
} from "@components/DashboardComponent/utils";
import { showServerError, getLanguageByKey } from "@utils";
import { ISO_DATE } from "@app-constants";
import { Spin, PageHeader } from "@components";
import { TotalCard } from "../Components/DashboardComponent/TotalCard";
import { StatBarList } from "../Components/DashboardComponent/StatBarList";
import { UsersBarChart } from "../Components/DashboardComponent/UsersBarChart";
import { ScrollContainer } from "../Components/DashboardComponent/ScrollContainer";

const THRESHOLD = 47;

/** helpers */
const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "-");
const safeArray = (a) => (Array.isArray(a) ? a : []);
const sum = (arr, key) => safeArray(arr).reduce((acc, x) => acc + (Number(x?.[key]) || 0), 0);
const pickIds = (arr) => safeArray(arr).map((x) => Number(x?.value ?? x)).filter((n) => Number.isFinite(n));

export const Dashboard = () => {
  const [statistics, setStatistics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(400);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [layout, setLayout] = useState([]);
  const [dateRange, setDateRange] = useState([]);
  const { userId } = useUser();
  const { enqueueSnackbar } = useSnackbar();

  const headerRef = useRef(null);
  const filterRef = useRef(null);
  const scrollRef = useRef(null);

  const [analytics, setAnalytics] = useState({
    by_users: [],
    by_groups: [],
    by_group_titles: [],
    total: { incoming_calls: 0, outgoing_calls: 0 },
  });

  const fetchStatistics = useCallback(async ({ dateRange, technicianId }) => {
    setIsLoading(true);
    const [start, end] = dateRange;
    try {
      // старый дашборд
      const statsData = await api.dashboard.statistics(
        {
          start_date: start ? format(start, ISO_DATE) : null,
          end_date: end ? format(end, ISO_DATE) : null,
          technician_id: technicianId,
        },
        userId
      );
      const { user_graphs, ...charts } = statsData;
      setLayout(normalizeUserGraphs(user_graphs));
      setStatistics(charts);

      // новый Analytics
      const user_ids = pickIds(selectedTechnicians);
      const body = {
        type: "calls",
        attributes: {
          user_ids,
          ...(start || end ? {
            timestamp: {
              from: start ? format(start, "yyyy-MM-dd") : undefined,
              until: end ? format(end, "yyyy-MM-dd") : undefined,
            }
          } : {}),
        },
      };
      const res = await api.dashboard.getAnalytics(body);
      setAnalytics({
        by_users: safeArray(res?.by_users),
        by_groups: safeArray(res?.by_groups),
        by_group_titles: safeArray(res?.by_group_titles),
        total: res?.total ?? { incoming_calls: 0, outgoing_calls: 0 },
      });
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [selectedTechnicians, userId]);

  const changeGraphPosition = async (id, graphPositions) => {
    try {
      await api.dashboard.updateGraphById(id, { user_id: userId, ...graphPositions });
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    }
  };

  const updateGraph = (movedGraph) => {
    const chartId = layout.find(({ i }) => i === movedGraph.i)?.i;
    if (chartId) {
      changeGraphPosition(chartId, {
        x: movedGraph.x, y: movedGraph.y, w: movedGraph.w, h: movedGraph.h,
      });
    }
  };

  const recalcSizes = useCallback(() => {
    const headerH = headerRef.current?.offsetHeight || 0;
    const filterH = filterRef.current?.offsetHeight || 0;
    const margins = 24;
    const viewportH = window.innerHeight || 800;
    setScrollHeight(Math.max(240, viewportH - headerH - filterH - margins));
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
    fetchStatistics({ dateRange, technicianId: getLastItemId(selectedTechnicians) });
  }, [fetchStatistics, dateRange, selectedTechnicians]);

  const { cols, rowHeight } = useMemo(() => {
    const cols = containerWidth > 1400 ? 6 : 4;
    const rowHeight = containerWidth / cols + 50;
    return { cols, rowHeight };
  }, [containerWidth]);

  // подготовка данных
  const totalIncoming = Number(analytics?.total?.incoming_calls) || 0;
  const totalOutgoing = Number(analytics?.total?.outgoing_calls) || 0;
  const totalAll = totalIncoming + totalOutgoing;

  const topGroupTitles = useMemo(
    () => [...safeArray(analytics.by_group_titles)]
      .sort((a, b) => (b.incoming_calls + b.outgoing_calls) - (a.incoming_calls + a.outgoing_calls))
      .slice(0, 6)
      .map((x) => ({ ...x, _sum: (x.incoming_calls || 0) + (x.outgoing_calls || 0) })),
    [analytics.by_group_titles]
  );

  const topUsers = useMemo(
    () => [...safeArray(analytics.by_users)]
      .sort((a, b) => (b.incoming_calls + b.outgoing_calls) - (a.incoming_calls + a.outgoing_calls))
      .slice(0, 8)
      .map((x) => ({ ...x, _sum: (x.incoming_calls || 0) + (x.outgoing_calls || 0) })),
    [analytics.by_users]
  );

  // layout
  const analyticsLayout = useMemo(() => ([
    { i: "a-total", x: 0, y: 0, w: 2, h: 1, static: false },
    { i: "a-groups", x: 2, y: 0, w: 2, h: 2, static: false },
    { i: "a-users", x: 4, y: 0, w: 2, h: 2, static: false },
    { i: "a-chart", x: 0, y: 2, w: 6, h: 2, static: false },
  ]), []);

  const combinedLayout = useMemo(() => {
    const ids = new Set(layout.map((l) => l.i));
    const extras = analyticsLayout.filter((l) => !ids.has(l.i));
    return [...layout, ...extras];
  }, [layout, analyticsLayout]);

  return (
    <div className="dashboard-container-wrapper" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div ref={headerRef}>
        <PageHeader title={getLanguageByKey("Dashboard")} />
      </div>

      <div ref={filterRef}>
        <Filter
          onSelectedTechnicians={setSelectedTechnicians}
          onSelectDataRange={setDateRange}
          selectedTechnicians={selectedTechnicians}
          dateRange={dateRange}
        />
      </div>

      {isLoading ? (
        <Flex align="center" justify="center" style={{ flex: 1, minHeight: 240 }}>
          <Spin />
        </Flex>
      ) : (
        <ScrollContainer ref={scrollRef} height={scrollHeight}>
          <GridLayout
            className="dashboard-layout"
            layout={combinedLayout}
            cols={cols}
            rowHeight={rowHeight}
            width={containerWidth}
            isResizable
            isDraggable
            compactType={null}
            preventCollision
            onResizeStop={(_, __, resizeGraph) => updateGraph(resizeGraph)}
            onDragStop={(_, __, movedGraph) => updateGraph(movedGraph)}
          >
            {/* старые пользовательские графики */}
            {layout.map((graph) => {
              const { label } = metricsDashboardCharts[graph.graphName];
              const ChartComponent = chartComponents[graph.type];
              const graphValue = statistics[graph.graphName]?.data;
              if (graphValue?.length) {
                const chartDataOld = chartsMetadata(graphValue, label, graph.type);
                return renderChart({
                  Component: ChartComponent,
                  chartData: chartDataOld,
                  chartLabel: label,
                  index: graph.i,
                });
              }
              return null;
            })}

            {/* новый блок: Итого */}
            <div key="a-total">
              <TotalCard
                totalAll={totalAll}
                totalIncoming={totalIncoming}
                totalOutgoing={totalOutgoing}
                dateRange={dateRange}
              />
            </div>

            {/* новый блок: Group Titles */}
            <div key="a-groups">
              <StatBarList
                title="По Group Title"
                items={topGroupTitles}
                total={sum(topGroupTitles, "_sum")}
                nameKey="group_title"
                valueKey="_sum"
              />
            </div>

            {/* новый блок: Users */}
            <div key="a-users">
              <StatBarList
                title="Топ пользователей"
                items={topUsers}
                total={sum(topUsers, "_sum")}
                nameKey="username"
                valueKey="_sum"
              />
            </div>

            {/* новый блок: Chart.js барчарт по пользователям */}
            <div key="a-chart">
              <UsersBarChart users={topUsers} />
            </div>
          </GridLayout>
        </ScrollContainer>
      )}
    </div>
  );
};
