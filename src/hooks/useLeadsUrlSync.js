import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "@hooks";
import { parseFiltersFromUrl } from "../Components/utils/parseFiltersFromUrl";
import { VIEW_MODE } from "@components/LeadsComponent/utils";

/**
 * Синхронизирует URL <-> состояние канбана/таблицы.
 * filtersReady переключается в true ТОЛЬКО после применения URL-фильтров (если есть),
 * чтобы не было стартового запроса с дефолтными фильтрами.
 */
export const useLeadsUrlSync = ({
    viewMode,
    setViewMode,

    // kanban
    setKanbanFilters,
    setKanbanFilterActive,
    fetchKanbanTickets,
    setChoiceWorkflow,

    // table
    handleApplyFiltersHardTicket,

    // groupTitle sync
    accessibleGroupTitles,
    customGroupTitle,
    setCustomGroupTitle,
}) => {
    const [searchParams] = useSearchParams();
    const { groupTitleForApi, workflowOptions } = useApp();

    const [filtersReady, setFiltersReady] = useState(false);

    const isGroupTitleSyncedRef = useRef(false);
    const hardApplyRef = useRef(handleApplyFiltersHardTicket);
    const lastHardAppliedRef = useRef(null);

    // держим актуальную ссылку на коллбек (без дерганья зависимостей)
    useEffect(() => {
        hardApplyRef.current = handleApplyFiltersHardTicket;
    }, [handleApplyFiltersHardTicket]);

    const areEqual = (a, b) => {
        if (a === b) return true;
        if (!a || !b) return false;
        try {
            return JSON.stringify(a) === JSON.stringify(b);
        } catch {
            return false;
        }
    };

    // синк view из URL
    useEffect(() => {
        const urlView = searchParams.get("view");
        const urlViewUpper = urlView ? urlView.toUpperCase() : undefined;
        if (urlViewUpper && urlViewUpper !== viewMode) {
            setViewMode(urlViewUpper);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, viewMode, setViewMode]);

    // главный эффект: применяем фильтры из URL и только потом ставим filtersReady=true
    useEffect(() => {
        const ctxReady = !!groupTitleForApi && workflowOptions.length > 0;
        if (!ctxReady) return;

        const parsed = parseFiltersFromUrl(searchParams);
        const urlGroupTitle = parsed.group_title;
        const type = searchParams.get("type");
        const hasUrlFilters = Object.keys(parsed).length > 0;

        // 1) сначала синхронизируем group_title из URL
        if (
            urlGroupTitle &&
            accessibleGroupTitles.includes(urlGroupTitle) &&
            customGroupTitle !== urlGroupTitle
        ) {
            setCustomGroupTitle(urlGroupTitle);
            isGroupTitleSyncedRef.current = true;
            return; // ждём следующий прогон
        }

        // 2) после синка group_title применяем фильтры и выставляем готовность
        if (isGroupTitleSyncedRef.current && urlGroupTitle && customGroupTitle === urlGroupTitle) {
            if (type === "light" && viewMode === VIEW_MODE.KANBAN) {
                setKanbanFilters(parsed);
                setKanbanFilterActive(true);
                fetchKanbanTickets(parsed);
                setChoiceWorkflow(parsed.workflow || []);
                setFiltersReady(true);
            } else if (type === "hard" && viewMode === VIEW_MODE.LIST) {
                if (!areEqual(lastHardAppliedRef.current, parsed)) {
                    lastHardAppliedRef.current = parsed;
                    hardApplyRef.current(parsed);
                }
                setFiltersReady(true); // готово для первого fetchHardTickets
            } else {
                setFiltersReady(true);
            }

            isGroupTitleSyncedRef.current = false;
            return;
        }

        // 3) обычный путь: group_title уже совпадает или отсутствует
        if (!isGroupTitleSyncedRef.current && customGroupTitle === urlGroupTitle) {
            if (type === "light" && viewMode === VIEW_MODE.KANBAN) {
                if (hasUrlFilters) {
                    setKanbanFilters(parsed);
                    setKanbanFilterActive(true);
                    fetchKanbanTickets(parsed);
                    setChoiceWorkflow(parsed.workflow || []);
                } else {
                    setKanbanFilterActive(false);
                    setKanbanFilters({});
                }
                setFiltersReady(true);
                return;
            }

            if (type === "hard" && viewMode === VIEW_MODE.LIST) {
                if (hasUrlFilters) {
                    if (!areEqual(lastHardAppliedRef.current, parsed)) {
                        lastHardAppliedRef.current = parsed;
                        hardApplyRef.current(parsed);
                    }
                } else {
                    lastHardAppliedRef.current = null; // дефолтная загрузка
                }
                setFiltersReady(true);
                return;
            }

            setFiltersReady(true);
            return;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        searchParams.toString(),
        viewMode,
        groupTitleForApi,
        workflowOptions,
        accessibleGroupTitles,
        customGroupTitle,
        setCustomGroupTitle,
        setKanbanFilters,
        setKanbanFilterActive,
        fetchKanbanTickets,
        setChoiceWorkflow,
    ]);

    return { filtersReady };
};
