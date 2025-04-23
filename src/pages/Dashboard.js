import React, { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { useSnackbar } from "notistack";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
} from "chart.js";
import { Flex } from "@mantine/core";
import { useUser } from "../hooks";
import { api } from "../api";
import { Filter } from "../Components/DashboardComponent/Filter";
import {
  chartsMetadata,
  metricsDashboardCharts,
  normalizeUserGraphs,
  renderChart,
  chartComponents,
  getLastItemId,
} from "../Components/DashboardComponent/utils";
import { showServerError, getLanguageByKey } from "../Components/utils";
import { ISO_DATE } from "../app-constants";
import { Spin } from "../Components/Spin";
import { PageHeader } from "../Components/PageHeader";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
);

const THRESHOLD = 47;

export const Dashboard = () => {
  const [statistics, setStatistics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [layout, setLayout] = useState([]);
  const [dateRange, setDateRange] = useState([]);
  const { userId } = useUser();
  const { enqueueSnackbar } = useSnackbar();

  const fetchStatistics = useCallback(async ({ dateRange, technicianId }) => {
    setIsLoading(true);
    const [start, end] = dateRange;
    try {
      const statsData = await api.dashboard.statistics(
        {
          start_date: start ? format(start, ISO_DATE) : null,
          end_date: end ? format(end, ISO_DATE) : null,
          technician_id: technicianId,
        },
        userId,
      );

      const { user_graphs, ...charts } = statsData;

      setLayout(normalizeUserGraphs(user_graphs));
      setStatistics(charts);
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changeGraphPosition = async (id, graphPositions) => {
    try {
      await api.dashboard.updateGraphById(id, {
        user_id: userId,
        ...graphPositions,
      });
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    }
  };

  const updateGraph = (movedGraph) => {
    const chartId = layout.find(({ i }) => i === movedGraph.i)?.i;

    if (chartId) {
      changeGraphPosition(chartId, {
        x: movedGraph.x,
        y: movedGraph.y,
        w: movedGraph.w,
        h: movedGraph.h,
      });
    }
  };

  useEffect(() => {
    const [start, end] = dateRange;
    if (!!start !== !!end) {
      return;
    }

    fetchStatistics({
      dateRange,
      technicianId: getLastItemId(selectedTechnicians),
    });
  }, [fetchStatistics, dateRange, selectedTechnicians]);

  useEffect(() => {
    const updateContainerDimensions = () => {
      const container = document.querySelector(".page-content");
      if (container) {
        setContainerWidth(container.offsetWidth - THRESHOLD);
      }
    };
    updateContainerDimensions();
    window.addEventListener("resize", updateContainerDimensions);
    return () =>
      window.removeEventListener("resize", updateContainerDimensions);
  }, []);

  const { cols, rowHeight } = useMemo(() => {
    const cols = containerWidth > 1400 ? 6 : 4;
    const rowHeight = containerWidth / cols + 50;

    return { cols, rowHeight };
  }, [containerWidth]);

  return (
    <div className="dashboard-container-wrapper">
      <PageHeader title={getLanguageByKey("Dashboard")} />

      <Filter
        onSelectedTechnicians={setSelectedTechnicians}
        onSelectDataRange={setDateRange}
        selectedTechnicians={selectedTechnicians}
        dateRange={dateRange}
      />

      {isLoading ? (
        <Flex align="center" justify="center" className="dashboard-loading">
          <Spin />
        </Flex>
      ) : (
        <GridLayout
          className="dashboard-layout"
          layout={layout}
          cols={cols}
          rowHeight={rowHeight}
          width={containerWidth}
          isResizable={true}
          isDraggable={true}
          compactType={null}
          preventCollision={true}
          onResizeStop={(_, __, resizeGraph) => updateGraph(resizeGraph)}
          onDragStop={(_, __, movedGraph) => updateGraph(movedGraph)}
        >
          {layout.map((graph) => {
            const { label } = metricsDashboardCharts[graph.graphName];
            const ChartComponent = chartComponents[graph.type];
            const graphValue = statistics[graph.graphName].data;

            if (graphValue?.length) {
              const chartData = chartsMetadata(graphValue, label, graph.type);

              return renderChart({
                Component: ChartComponent,
                chartData,
                chartLabel: label,
                index: graph.i,
              });
            }

            return null;
          })}
        </GridLayout>
      )}
    </div>
  );
};

