import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Box } from "@mantine/core";
import { TotalCard } from "./TotalCard";
import { TopUsersCard } from "./TopUsersCard";

const ResponsiveGridLayout = WidthProvider(Responsive);

const ROW_HEIGHT = 8;
const MARGIN = [8, 8];
const PADDING = [8, 8];

const COLS_MAX = 150;

const DEFAULT_SIZE = { w: 30, h: 20, minW: 6, maxW: 150, minH: 6 };

const WIDGET_SIZES = {
    general: DEFAULT_SIZE,
    group: DEFAULT_SIZE,
    user: DEFAULT_SIZE,
    source: DEFAULT_SIZE,
    gt: DEFAULT_SIZE,
    top_users: { ...DEFAULT_SIZE, w: 60, h: 28 }, // выше/шире под список
};

const getSize = (type) => WIDGET_SIZES[type] || DEFAULT_SIZE;

// приоритеты: general → gt-* → ug-* → user-* → остальные
const priorityOf = (w) => {
    const id = String(w?.id ?? "");
    if (id === "general") return 0;
    if (id.startsWith("gt-")) return 1;    // group title
    if (id.startsWith("ug-")) return 2;    // user group
    if (id.startsWith("user-")) return 3;  // users
    return 4;                               // всё остальное (source, platform и т.п.)
};

/** раскладка слева-направо с переносом по ширине COLS_MAX */
const buildRowLayout = (widgets = []) => {
    const items = [];
    let x = 0;
    let y = 0;
    const rowH = DEFAULT_SIZE.h;

    for (const w of widgets) {
        if (w.type === "separator") continue;

        const t = getSize(w.type);
        if (x + t.w > COLS_MAX) {
            y += rowH;
            x = 0;
        }

        items.push({
            i: String(w.id),
            x,
            y,
            w: t.w,
            h: t.h,
            minW: t.minW,
            maxW: t.maxW,
            minH: t.minH,
            static: false,
            resizeHandles: ["e", "se"],
        });

        x += t.w;
    }
    return items;
};

const buildLayoutsAllBps = (widgets = []) => {
    const single = buildRowLayout(widgets);
    return { lg: single, md: single, sm: single, xs: single, xxs: single };
};
const pickAnyBpLayout = (layouts) =>
    layouts.lg || layouts.md || layouts.sm || layouts.xs || layouts.xxs || [];



const DashboardGrid = ({ widgets = [], dateRange }) => {
    const COLS = useMemo(
        () => ({ lg: COLS_MAX, md: COLS_MAX, sm: COLS_MAX, xs: COLS_MAX, xxs: COLS_MAX }),
        []
    );

    // убираем сепараторы
    const visibleWidgets = useMemo(
        () => (widgets || []).filter((w) => w.type !== "separator"),
        [widgets]
    );

    // сортируем по приоритету, сохраняем порядок внутри группы
    const orderedWidgets = useMemo(() => {
        return visibleWidgets
            .map((w, idx) => ({ w, idx }))
            .sort((a, b) => {
                const pa = priorityOf(a.w);
                const pb = priorityOf(b.w);
                if (pa !== pb) return pa - pb;
                return a.idx - b.idx;
            })
            .map((x) => x.w);
    }, [visibleWidgets]);

    const [layouts, setLayouts] = useState(() => buildLayoutsAllBps(orderedWidgets));
    useEffect(() => {
        setLayouts(buildLayoutsAllBps(orderedWidgets));
    }, [orderedWidgets]);

    const handleLayoutChange = useCallback((_curr, all) => setLayouts(all), []);
    const gridKey = useMemo(() => orderedWidgets.map((w) => w.id).join("|"), [orderedWidgets]);
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
                draggableCancel=".mantine-Badge,.mantine-Progress,.mantine-Button,.mantine-Input"
            >
                {orderedWidgets.map((w) => {
                    const li = currentLayout.find((l) => l.i === String(w.id));
                    const sizeInfo = li ? `${li.w} × ${li.h}` : null;

                    if (w.type === "top_users") {
                        return (
                            <div key={w.id} style={{ height: "100%" }}>
                                <TopUsersCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    rows={w.rows}
                                    bg={w.bg}
                                />
                            </div>
                        );
                    }

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
                                    bg={w.bg}
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
