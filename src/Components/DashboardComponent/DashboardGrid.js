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

const COLS_MAX = 150;      // 5 карточек * 21
const PER_ROW = 6;
const SEP_H = 3;        // высота разделителя в грид-юнитах

const DEFAULT_SIZE = { w: 25, h: 21, minW: 6, maxW: 105, minH: 6 };

const WIDGET_SIZES = {
    general: DEFAULT_SIZE,
    group: DEFAULT_SIZE,
    user: DEFAULT_SIZE,
    source: DEFAULT_SIZE,
    gt: DEFAULT_SIZE,
    separator: { w: COLS_MAX, h: SEP_H, minW: COLS_MAX, minH: SEP_H, static: true },
};

const getSize = (type) => WIDGET_SIZES[type] || DEFAULT_SIZE;

/** раскладка с y-курcором + полноширинные separator’ы */
const buildRowLayout = (widgets = []) => {
    const items = [];
    let y = 0;
    let col = 0;
    const nextRow = () => { y += DEFAULT_SIZE.h; col = 0; };

    for (const w of widgets) {
        if (w.type === "separator") {
            if (col !== 0) nextRow();
            items.push({
                i: String(w.id),
                x: 0, y,
                w: COLS_MAX, h: SEP_H,
                minW: COLS_MAX, minH: SEP_H,
                static: true,
                isDraggable: false,
                isResizable: false,
            });
            y += SEP_H; // след. карточки пойдут сразу под заголовком
            col = 0;
            continue;
        }

        const t = getSize(w.type);
        const x = col * DEFAULT_SIZE.w;
        items.push({
            i: String(w.id),
            x, y,
            w: t.w, h: t.h,
            minW: t.minW, maxW: t.maxW, minH: t.minH,
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
                compactType={null}     // без автопака
                preventCollision       // без «отталкивания» и наложений
                isResizable
                isDraggable
                onLayoutChange={handleLayoutChange}
                draggableCancel=".mantine-Badge,.mantine-Progress,.mantine-Button,.mantine-Input"
            >
                {widgets.map((w) => {
                    if (w.type === "separator") {
                        return (
                            <div key={w.id} style={{ height: "100%", display: "flex", alignItems: "center" }}>
                                <Divider
                                    label={
                                        <Box
                                            px="xs" py={4}
                                            style={{
                                                borderRadius: 8,
                                                fontWeight: 700,
                                                fontSize: 12,
                                                textTransform: "uppercase",
                                                letterSpacing: 0.6,
                                                background: "rgba(0,0,0,0.04)",
                                            }}
                                        >
                                            {w.label}
                                        </Box>
                                    }
                                    labelPosition="left"
                                    variant="solid"
                                    color="gray"
                                />
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
