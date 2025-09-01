import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Box } from "@mantine/core";
import { TotalCard } from "./TotalCard";

const ResponsiveGridLayout = WidthProvider(Responsive);

const ROW_HEIGHT = 8;
const MARGIN = [8, 8];
const PADDING = [8, 8];

const DEFAULT_SIZE = { w: 21, h: 18, minW: 6, maxW: 105, minH: 6 };

const WIDGET_SIZES = {
    general: DEFAULT_SIZE,
    group: DEFAULT_SIZE,
    user: DEFAULT_SIZE,
    source: DEFAULT_SIZE,
    gt: DEFAULT_SIZE,
};

const getSize = (type) => WIDGET_SIZES[type] || DEFAULT_SIZE;

const buildRowLayout = (widgets = []) => {
    const perRow = 5;
    return widgets.map((w, idx) => {
        const t = getSize(w.type);
        const row = Math.floor(idx / perRow);
        const col = idx % perRow;
        return {
            i: String(w.id),
            x: col * t.w,
            y: row * t.h,
            w: t.w,
            h: t.h,
            minW: t.minW,
            maxW: t.maxW,
            minH: t.minH,
            static: false,
            resizeHandles: ["e", "se"],
        };
    });
};

const buildLayoutsAllBps = (widgets = []) => {
    const single = buildRowLayout(widgets);
    return { lg: single, md: single, sm: single, xs: single, xxs: single };
};

const pickAnyBpLayout = (layouts) =>
    layouts.lg || layouts.md || layouts.sm || layouts.xs || layouts.xxs || [];

const DashboardGrid = ({ widgets = [], dateRange }) => {
    const colsMax = 105;
    const COLS = useMemo(
        () => ({ lg: colsMax, md: colsMax, sm: colsMax, xs: colsMax, xxs: colsMax }),
        []
    );

    const [layouts, setLayouts] = useState(() => buildLayoutsAllBps(widgets));

    useEffect(() => {
        setLayouts(buildLayoutsAllBps(widgets));
    }, [widgets]);

    const handleLayoutChange = useCallback((_curr, all) => {
        setLayouts(all);
    }, []);

    const gridKey = useMemo(() => widgets.map((w) => w.id).join("|"), [widgets]);
    const currentLayout = pickAnyBpLayout(layouts);

    return (
        <Box style={{ width: "100%", height: "100%" }}>
            <ResponsiveGridLayout
                key={gridKey}
                className="layout"
                breakpoints={{ lg: 1400, md: 1100, sm: 900, xs: 600, xxs: 0 }}
                cols={COLS}
                layouts={layouts}
                rowHeight={ROW_HEIGHT}
                margin={MARGIN}
                containerPadding={PADDING}
                compactType={null}
                preventCollision
                isResizable
                isDraggable
                onLayoutChange={handleLayoutChange}
            >
                {widgets.map((w) => {
                    const li = currentLayout.find((l) => l.i === String(w.id));
                    const sizeInfo = li ? `${li.w} × ${li.h}` : null;

                    return (
                        <div key={w.id} style={{ height: "100%" }}>
                            <Box style={{ height: "100%" }}>
                                <TotalCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    totalAll={Number.isFinite(w.total) ? w.total : 0}
                                    totalIncoming={Number.isFinite(w.incoming) ? w.incoming : 0}
                                    totalOutgoing={Number.isFinite(w.outgoing) ? w.outgoing : 0}
                                    dateRange={dateRange}
                                    sizeInfo={sizeInfo}
                                />
                            </Box>
                        </div>
                    );
                })}
            </ResponsiveGridLayout>
        </Box>
    );
};

export default DashboardGrid;
