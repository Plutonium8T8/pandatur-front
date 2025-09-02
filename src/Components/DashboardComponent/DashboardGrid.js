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

const COLS_MAX = 150;

const DEFAULT_SIZE = { w: 30, h: 20, minW: 6, maxW: 150, minH: 6 };

const WIDGET_SIZES = {
    general: DEFAULT_SIZE,
    group: DEFAULT_SIZE,
    user: DEFAULT_SIZE,
    source: DEFAULT_SIZE,
    gt: DEFAULT_SIZE,
};

const getSize = (type) => WIDGET_SIZES[type] || DEFAULT_SIZE;

/** раскладка слева-направо с переносом по ширине COLS_MAX */
const buildRowLayout = (widgets = []) => {
    const items = [];
    let x = 0;                // текущая «колоночная» X-позиция
    let y = 0;                // текущая «строка» (в грид-юнитах)
    const rowH = DEFAULT_SIZE.h; // высота ряда (по умолчанию h карточки)

    for (const w of widgets) {
        if (w.type === "separator") continue;

        const t = getSize(w.type);
        // если карточка не влезает в остаток ряда — перенос на новую строку
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

        x += t.w; // сдвиг вправо для следующей карточки
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

    const visibleWidgets = useMemo(
        () => (widgets || []).filter((w) => w.type !== "separator"),
        [widgets]
    );

    const [layouts, setLayouts] = useState(() => buildLayoutsAllBps(visibleWidgets));
    useEffect(() => {
        setLayouts(buildLayoutsAllBps(visibleWidgets));
    }, [visibleWidgets]);

    const handleLayoutChange = useCallback((_curr, all) => setLayouts(all), []);
    const gridKey = useMemo(() => visibleWidgets.map((w) => w.id).join("|"), [visibleWidgets]);
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
                {visibleWidgets.map((w) => {
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
