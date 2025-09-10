import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Box } from "@mantine/core";
import { TotalCard } from "./TotalCard";
import { TopUsersCard } from "./TopUsersCard";
import { TicketStateCard } from "./TicketStateCard";
import { TicketsIntoWorkCard } from "./TicketsIntoWorkCard";
import { SystemUsageCard } from "./SystemUsageCard";

const ResponsiveGridLayout = WidthProvider(Responsive);

const ROW_HEIGHT = 8;
const MARGIN = [8, 8];
const PADDING = [8, 8];

const COLS_MAX = 150;

const ROW_GAP = 4;          // вертикальный зазор между «рядами-группами»
const FIRST_ROW_HGAP = 3;   // минимальный горизонтальный зазор между карточками в 1-й группе

// размеры
const DEFAULT_SIZE_ROW0 = { w: 45, h: 20, minW: 6, maxW: 150, minH: 6 }; // 1-я группа
const DEFAULT_SIZE_ROWX = { w: 30, h: 20, minW: 6, maxW: 150, minH: 6 }; // 2-я+ группы

const WIDGET_SIZES = {
    top_users: { ...DEFAULT_SIZE_ROWX, w: 60, h: 28 },
};

const rowOf = (w) => {
    const id = String(w?.id ?? "");
    if (id === "general" || id.startsWith("gt-") || id.startsWith("ug-")) return 0; // 1-я группа
    if (w.type === "top_users" || id.startsWith("user-")) return 1;                // 2-я группа
    return 2;                                                                       // 3-я группа
};

const getSizeByRow = (w, row) => {
    const explicit = WIDGET_SIZES[w.type];
    if (explicit) return explicit;
    return row === 0 ? DEFAULT_SIZE_ROW0 : DEFAULT_SIZE_ROWX;
};

// ——— helpers для 1-й группы ———

// бьём список виджетов первой группы на строки так, чтобы хотя бы минимальный FIRST_ROW_HGAP помещался
const splitFirstGroupIntoLines = (widgets) => {
    const lines = [];
    let line = [];
    let sumW = 0;

    for (const w of widgets) {
        const t = getSizeByRow(w, 0);
        const nextCount = line.length + 1;
        const minNeeded = sumW + t.w + FIRST_ROW_HGAP * Math.max(0, nextCount - 1);
        if (nextCount > 1 && minNeeded > COLS_MAX) {
            // закрываем текущую строку
            if (line.length) lines.push(line);
            // начинаем новую
            line = [w];
            sumW = t.w;
        } else {
            line.push(w);
            sumW += t.w;
        }
    }
    if (line.length) lines.push(line);
    return lines;
};

// равномерная раскладка одной строки первой группы: первый слева, последний справа, между ними равные интервалы
const layoutFirstGroupLine = (lineWidgets, yStart, items) => {
    // суммарная ширина карточек
    const sumW = lineWidgets.reduce((acc, w) => acc + getSizeByRow(w, 0).w, 0);
    const n = lineWidgets.length;

    if (n === 1) {
        // один виджет — прижимаем к левому краю
        const w0 = lineWidgets[0];
        const t0 = getSizeByRow(w0, 0);
        items.push({
            i: String(w0.id), x: 0, y: yStart, w: t0.w, h: t0.h,
            minW: t0.minW, maxW: t0.maxW, minH: t0.minH, static: false, resizeHandles: ["e", "se"],
        });
        return yStart + t0.h;
    }

    // вычисляем равный gap так, чтобы последний заканчивался строго на COLS_MAX
    // гарантировано не отрицательный, т.к. splitFirstGroupIntoLines обеспечивает минимум
    const gapsCount = n - 1;
    const totalGap = COLS_MAX - sumW;
    const baseGap = Math.floor(totalGap / gapsCount);
    const remainder = totalGap % gapsCount; // «хвост» раскидываем по первым gap’ам

    let x = 0;
    for (let i = 0; i < n; i++) {
        const w = lineWidgets[i];
        const t = getSizeByRow(w, 0);
        items.push({
            i: String(w.id), x, y: yStart, w: t.w, h: t.h,
            minW: t.minW, maxW: t.maxW, minH: t.minH, static: false,
            resizeHandles: i === n - 1 ? ["w", "sw"] : ["e", "se"], // правому — логичнее тянуть слева
        });
        // добавляем равномерный gap после карточки, кроме последней
        if (i < n - 1) {
            const extra = i < remainder ? 1 : 0;
            x += t.w + baseGap + extra;
        }
    }
    // высота строки = максимальная высота карточек (в сеточных единицах)
    const lineH = Math.max(...lineWidgets.map((w) => getSizeByRow(w, 0).h));
    return yStart + lineH;
};

// ——— основная раскладка ———
const buildLayoutByRows = (widgets = []) => {
    const rows = [[], [], []];
    widgets.forEach((w) => {
        if (w.type !== "separator") rows[rowOf(w)].push(w);
    });

    const items = [];
    const rowBaseH = DEFAULT_SIZE_ROWX.h;
    let yCursor = 0;

    for (let r = 0; r < rows.length; r++) {
        const rowWidgets = rows[r];
        if (!rowWidgets.length) continue;

        let y = yCursor;
        let localMaxY = yCursor;

        if (r === 0) {
            // ПЕРВАЯ ГРУППА: равные промежутки и крайние по краям в КАЖДОЙ строке
            const lines = splitFirstGroupIntoLines(rowWidgets);
            for (const line of lines) {
                y = layoutFirstGroupLine(line, y, items);
                localMaxY = Math.max(localMaxY, y);
            }
        } else {
            // ПРОЧИЕ ГРУППЫ: обычный поток, без выравнивания по краям
            let x = 0;
            for (let i = 0; i < rowWidgets.length; i++) {
                const w = rowWidgets[i];
                const t = getSizeByRow(w, r);

                if (x + t.w > COLS_MAX) {
                    x = 0;
                    y += rowBaseH;
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
                localMaxY = Math.max(localMaxY, y + t.h);
            }
        }

        yCursor = localMaxY + ROW_GAP;
    }

    return items;
};

const buildLayoutsAllBps = (widgets = []) => {
    const single = buildLayoutByRows(widgets);
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

    // сохраняем порядок, но раскладываем по группам
    const orderedByRows = useMemo(() => {
        const r0 = [], r1 = [], r2 = [];
        for (const w of visibleWidgets) {
            const r = rowOf(w);
            if (r === 0) r0.push(w);
            else if (r === 1) r1.push(w);
            else r2.push(w);
        }
        return [...r0, ...r1, ...r2];
    }, [visibleWidgets]);

    const [layouts, setLayouts] = useState(() => buildLayoutsAllBps(orderedByRows));

    useEffect(() => {
        setLayouts(buildLayoutsAllBps(orderedByRows));
    }, [orderedByRows]);

    const handleLayoutChange = useCallback((_curr, all) => setLayouts(all), []);
    const gridKey = useMemo(() => orderedByRows.map((w) => w.id).join("|"), [orderedByRows]);
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
                {orderedByRows.map((w) => {
                    const li = currentLayout.find((l) => l.i === String(w.id));
                    const sizeInfo = li ? `${li.w} × ${li.h}` : null;

                    if (w.type === "top_users") {
                        return (
                            <div key={w.id} style={{ height: "100%" }}>
                                <TopUsersCard title={w.title} subtitle={w.subtitle} rows={w.rows} bg={w.bg} widgetType={w.widgetType} />
                            </div>
                        );
                    }

                    if (w.type === "ticket_state") {
                        return (
                            <div key={w.id} style={{ height: "100%" }}>
                                <Box style={{ height: "100%" }}>
                                    <TicketStateCard
                                        title={w.title}
                                        subtitle={w.subtitle}
                                        oldClientTickets={Number.isFinite(w.oldClientTickets) ? w.oldClientTickets : 0}
                                        newClientTickets={Number.isFinite(w.newClientTickets) ? w.newClientTickets : 0}
                                        totalTickets={Number.isFinite(w.totalTickets) ? w.totalTickets : 0}
                                        dateRange={dateRange}
                                        sizeInfo={sizeInfo}
                                        bg={w.bg}
                                    />
                                </Box>
                            </div>
                        );
                    }

                    if (w.type === "tickets_into_work") {
                        return (
                            <div key={w.id} style={{ height: "100%" }}>
                                <Box style={{ height: "100%" }}>
                                    <TicketsIntoWorkCard
                                        title={w.title}
                                        subtitle={w.subtitle}
                                        takenIntoWorkTickets={Number.isFinite(w.takenIntoWorkTickets) ? w.takenIntoWorkTickets : 0}
                                        dateRange={dateRange}
                                        sizeInfo={sizeInfo}
                                        bg={w.bg}
                                    />
                                </Box>
                            </div>
                        );
                    }

                    if (w.type === "system_usage") {
                        return (
                            <div key={w.id} style={{ height: "100%" }}>
                                <Box style={{ height: "100%" }}>
                                    <SystemUsageCard
                                        title={w.title}
                                        subtitle={w.subtitle}
                                        activityMinutes={Number.isFinite(w.activityMinutes) ? w.activityMinutes : 0}
                                        activityHours={Number.isFinite(w.activityHours) ? w.activityHours : 0}
                                        dateRange={dateRange}
                                        sizeInfo={sizeInfo}
                                        bg={w.bg}
                                    />
                                </Box>
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
