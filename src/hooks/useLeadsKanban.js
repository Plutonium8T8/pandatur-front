import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSnackbar } from "notistack";
import { useApp, useDebounce } from "@hooks";
import { api } from "../api";
import { showServerError, getLanguageByKey } from "@utils";

/**
 * Отвечает за канбан: загрузка light, локальные фильтры, поиск, спиннеры, видимые тикеты.
 */
export const useLeadsKanban = () => {
    const { enqueueSnackbar } = useSnackbar();
    const {
        tickets: globalTickets,
        fetchTickets: fetchGlobalLight,
        groupTitleForApi,
        setLightTicketFilters,
    } = useApp();

    // local state
    const [kanbanTickets, setKanbanTickets] = useState([]);
    const [kanbanFilters, setKanbanFilters] = useState({});
    const [kanbanSearchTerm, setKanbanSearchTerm] = useState("");
    const [kanbanSpinner, setKanbanSpinner] = useState(false);
    const [kanbanFilterActive, setKanbanFilterActive] = useState(false);
    const [selectedWorkflow, setSelectedWorkflow] = useState([]); // для подсветки выбранных колонок
    const [choiceWorkflow, setChoiceWorkflow] = useState([]);     // прокидывается в WorkflowColumns

    const isSearching = !!kanbanSearchTerm?.trim();
    const debouncedSearch = useDebounce(kanbanSearchTerm, 2000);
    
    // Защита от "гонки" - отслеживаем актуальный запрос
    const kanbanReqIdRef = useRef(0);

    // загрузка light с локальными фильтрами (для канбана)
    const fetchKanbanTickets = useCallback(async (filters = {}) => {
        // Увеличиваем ID запроса - это делает предыдущие запросы неактуальными
        const reqId = ++kanbanReqIdRef.current;
        
        setKanbanSpinner(true);
        setKanbanFilters(filters);
        setKanbanTickets([]);

        let page = 1;
        let totalPages = 1;

        try {
            const { group_title, search, ...attributes } = filters;

            while (page <= totalPages) {
                // Проверяем перед каждым запросом: актуален ли еще этот запрос?
                if (reqId !== kanbanReqIdRef.current) {
                    return; // Если начался новый запрос - останавливаем текущий
                }

                const res = await api.tickets.filters({
                    page,
                    type: "light",
                    group_title: group_title || groupTitleForApi,
                    attributes: {
                        ...attributes,
                        ...(search?.trim() ? { search: search.trim() } : {}),
                    },
                });

                // Проверяем после получения ответа: актуален ли еще этот запрос?
                if (reqId !== kanbanReqIdRef.current) {
                    return; // Если начался новый запрос - не обновляем состояние
                }

                const normalized = res.tickets.map((t) => ({
                    ...t,
                    last_message: t.last_message || getLanguageByKey("no_messages"),
                    time_sent: t.time_sent || null,
                    unseen_count: t.unseen_count || 0,
                }));

                setKanbanTickets((prev) => [...prev, ...normalized]);

                totalPages = res.pagination?.total_pages || 1;
                page += 1;
            }
        } catch (e) {
            // Показываем ошибку только если этот запрос еще актуален
            if (reqId === kanbanReqIdRef.current) {
                enqueueSnackbar(showServerError(e), { variant: "error" });
            }
        } finally {
            // Убираем спиннер только если этот запрос еще актуален
            if (reqId === kanbanReqIdRef.current) {
                setKanbanSpinner(false);
            }
        }
    }, [enqueueSnackbar, groupTitleForApi]);

    // искать по дебаунсу
    useEffect(() => {
        if (!groupTitleForApi) return;

        if (debouncedSearch.trim()) {
            setKanbanFilterActive(true);
            fetchKanbanTickets({
                ...kanbanFilters,
                search: debouncedSearch.trim(),
            });
        } else {
            // очищаем локальный список и выключаем флаг активного фильтра
            setKanbanTickets([]);
            setKanbanFilterActive(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, groupTitleForApi]);

    // синхронизация локального состояния канбана с глобальным при обновлении тикетов
    useEffect(() => {
        if (kanbanFilterActive && kanbanTickets.length > 0) {
            // Создаем Map для быстрого поиска обновленных тикетов
            const globalTicketsMap = new Map(globalTickets.map(ticket => [ticket.id, ticket]));
            
            // Обновляем локальные тикеты, если они изменились в глобальном состоянии
            setKanbanTickets(prevKanbanTickets => {
                let hasChanges = false;
                const updatedTickets = prevKanbanTickets.map(localTicket => {
                    const globalTicket = globalTicketsMap.get(localTicket.id);
                    if (globalTicket && JSON.stringify(localTicket) !== JSON.stringify(globalTicket)) {
                        hasChanges = true;
                        return globalTicket;
                    }
                    return localTicket;
                });
                
                return hasChanges ? updatedTickets : prevKanbanTickets;
            });
        }
    }, [globalTickets, kanbanFilterActive]);

    // вычисление видимых тикетов
    const visibleTickets = useMemo(() => {
        return (isSearching || kanbanSpinner || kanbanFilterActive) ? kanbanTickets : globalTickets;
    }, [isSearching, kanbanSpinner, kanbanFilterActive, kanbanTickets, globalTickets]);

    // какой метод подхватит WorkflowColumns при "обновить"
    const currentFetchTickets = useMemo(() => {
        return kanbanSearchTerm?.trim() ? fetchKanbanTickets : fetchGlobalLight;
    }, [kanbanSearchTerm, fetchKanbanTickets, fetchGlobalLight]);

    // программное применение фильтров из модалки
    const applyKanbanFilters = useCallback((selectedFilters) => {
        setLightTicketFilters(selectedFilters); // чтобы дефолтная загрузка знала, что было выбрано
        setKanbanFilters(selectedFilters);
        setKanbanFilterActive(true);
    }, [setLightTicketFilters]);

    // принудительное обновление отфильтрованных тикетов
    const refreshKanbanTickets = useCallback(() => {
        if (kanbanFilterActive) {
            // Пересчитываем фильтры с текущими параметрами
            fetchKanbanTickets(kanbanFilters);
        }
    }, [kanbanFilterActive, kanbanFilters, fetchKanbanTickets]);

    // полный сброс канбана (как в handleReset)
    const resetKanban = useCallback(() => {
        setKanbanFilters({});
        setKanbanFilterActive(false);
        setKanbanTickets([]);
        setKanbanSearchTerm("");
    }, []);

    return {
        // data
        visibleTickets,
        kanbanTickets,
        kanbanFilters,
        kanbanSpinner,
        kanbanFilterActive,
        selectedWorkflow,
        choiceWorkflow,

        // search
        kanbanSearchTerm,
        setKanbanSearchTerm,
        debouncedSearch,
        isSearching,

        // actions
        fetchKanbanTickets,
        currentFetchTickets,
        applyKanbanFilters,
        refreshKanbanTickets,
        resetKanban,
        setKanbanFilters,
        setKanbanTickets,
        setKanbanFilterActive,
        setSelectedWorkflow,
        setChoiceWorkflow,
    };
};
