import React, { useEffect, useState, useCallback } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Box } from "@mantine/core";
import { TotalCard } from "./TotalCard";

const ResponsiveGridLayout = WidthProvider(Responsive);

// тонкая сетка
const BREAKPOINTS = { lg: 1400, md: 1100, sm: 900, xs: 600, xxs: 0 };
const COLS = { lg: 36, md: 30, sm: 24, xs: 16, xxs: 12 };
const ROW_HEIGHT = 8;
const MARGIN = [8, 8];
const PADDING = [8, 8];

// базовые размеры виджетов
const WIDGET_SIZES = {
    general: { w: 12, h: 14, minW: 8, minH: 10, maxW: 36 },
    group: { w: 8, h: 12, minW: 6, minH: 8 },
    user: { w: 8, h: 12, minW: 6, minH: 8 },
    source: { w: 6, h: 10, minW: 4, minH: 6 },
    gt: { w: 8, h: 12, minW: 6, minH: 8 }, // если нужен отдельный тип
};

const buildLayouts = (widgets) => {
    const single = widgets.map((wgt) => {
        const t = WIDGET_SIZES[wgt.type] || { w: 8, h: 10 };
        return {
            i: wgt.id,
            x: 0, y: 0,
            w: t.w, h: t.h,
            minW: t.minW, minH: t.minH, maxW: t.maxW,
            static: false,
        };
    });
    return { lg: single, md: single, sm: single, xs: single, xxs: single };
};

const DashboardGrid = ({ widgets = [], dateRange }) => {
    const [layouts, setLayouts] = useState(() => {
        try { return JSON.parse(localStorage.getItem("dash_layouts")) || buildLayouts(widgets); }
        catch { return buildLayouts(widgets); }
    });

    // добавляем в layout новые виджеты при их появлении
    useEffect(() => {
        const anyBp = Object.values(layouts)[0] || [];
        const known = new Set(anyBp.map(l => l.i));
        const needAdd = widgets.filter(w => !known.has(w.id));
        if (!needAdd.length) return;

        const base = buildLayouts(needAdd);
        const merged = Object.keys({ ...layouts, ...base }).reduce((acc, bp) => {
            acc[bp] = [...(layouts[bp] || []), ...(base[bp] || [])];
            return acc;
        }, {});
        setLayouts(merged);
    }, [widgets]); // eslint-disable-line

    const handleLayoutChange = useCallback((_curr, all) => {
        setLayouts(all);
        localStorage.setItem("dash_layouts", JSON.stringify(all));
    }, []);

    return (
        <Box style={{ width: "100%", height: "100%" }}>
            <ResponsiveGridLayout
                className="layout"
                breakpoints={BREAKPOINTS}
                cols={COLS}
                layouts={layouts}
                rowHeight={ROW_HEIGHT}
                margin={MARGIN}
                containerPadding={PADDING}
                isResizable
                isDraggable
                compactType={null}
                preventCollision
                onLayoutChange={handleLayoutChange}
            >
                {widgets.map(w => (
                    <div key={w.id} style={{ height: "100%" }}>
                        <Box style={{ height: "100%" }}>
                            <TotalCard
                                title={w.title}
                                subtitle={w.subtitle}
                                totalAll={Number.isFinite(w.total) ? w.total : 0}
                                totalIncoming={Number.isFinite(w.incoming) ? w.incoming : 0}
                                totalOutgoing={Number.isFinite(w.outgoing) ? w.outgoing : 0}
                                dateRange={dateRange}
                            />
                        </Box>
                    </div>
                ))}
            </ResponsiveGridLayout>
        </Box>
    );
};

export default DashboardGrid;
