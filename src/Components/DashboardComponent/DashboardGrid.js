import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Box, Divider } from "@mantine/core";
import { TotalCard } from "./TotalCard";

const ResponsiveGridLayout = WidthProvider(Responsive);

const ROW_HEIGHT = 8;
const MARGIN = [8, 8];
const PADDING = [8, 8];

// 5 карточек в ряд: 5 * 21 = 105 колонок
const COLS_MAX = 105;
const PER_ROW = 5;

const DEFAULT_SIZE = { w: 21, h: 18, minW: 6, maxW: 105, minH: 6 };
const SEP_H = 2; // высота divider'а в грид-юнитах

const WIDGET_SIZES = {
    general: DEFAULT_SIZE,
    group: DEFAULT_SIZE,
    user: DEFAULT_SIZE,
    source: DEFAULT_SIZE,
    gt: DEFAULT_SIZE,
    separator: { w: COLS_MAX, h: SEP_H, minW: COLS_MAX, minH: SEP_H },
};

const getSize = (type) => WIDGET_SIZES[type] || DEFAULT_SIZE;

/** новая раскладка: используем y-курсор вместо row*DEFAULT_SIZE.h */
const buildRowLayout = (widgets = []) => {
    const items = [];
    let y = 0;     // текущая «высота» в грид-юнитах
    let col = 0;   // 0..PER_ROW-1

    const nextRow = () => {
        y += DEFAULT_SIZE.h;
        col = 0;
    };

    for (const w of widgets) {
        // separator занимает всю ширину и всегда с новой строки
        if (w.type === "separator") {
            if (col !== 0) nextRow(); // перенести на новую строку, если были карточки
            items.push({
                i: String(w.id),
                x: 0,
                y,
                w: COLS_MAX,
                h: SEP_H,
                minW: COLS_MAX,
                minH: SEP_H,
                static: true,
                isDraggable: false,
                isResizable: false,
            });
            y += SEP_H; // сразу под ним начнётся следующая группа
            col = 0;
            continue;
        }

        const t = getSize(w.type);
        const x = col * DEFAULT_SIZE.w;

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

        col += 1;
        if (col >= PER_ROW) nextRow();
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

    const [layouts, setLayouts] = useState(() => buildLayoutsAllBps(widgets));
    useEffect(() => { setLayouts(buildLayoutsAllBps(widgets)); }, [widgets]);

    const handleLayoutChange = useCallback((_curr, all) => setLayouts(all), []);
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
                compactType={null}      // без автопака
                preventCollision        // без «отталкивания»
                isResizable
                isDraggable
                onLayoutChange={handleLayoutChange}
                draggableCancel=".mantine-Badge,.mantine-Progress,.mantine-Button,.mantine-Input"
            >
                {widgets.map((w) => {
                    if (w.type === "separator") {
                        return (
                            <div key={w.id} style={{ height: "100%", padding: 4 }}>
                                <Divider label={w.label} labelPosition="left" style={{ opacity: 0.9 }} />
                            </div>
                        );
                    }
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
