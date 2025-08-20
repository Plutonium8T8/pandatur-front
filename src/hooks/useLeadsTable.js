import { useCallback, useMemo, useRef, useState } from "react";
import { useSnackbar } from "notistack";
import { useApp } from "./useApp";
import { api } from "../api";
import { showServerError } from "../Components/utils";

/**
 * Таблица (hard): фильтры, пагинация, загрузка, perPage, спиннер.
 * Сохраняет текущее поведение:
 * - если есть явные workflow в фильтрах -> используем их
 * - иначе, если поиск включён -> используем полный workflowOptions
 * - иначе -> workflowOptions без [Realizat..., Închis..., Auxiliar]
 */
export const useLeadsTable = () => {
    const { enqueueSnackbar } = useSnackbar();
    const { groupTitleForApi, workflowOptions } = useApp();

    const [hardTickets, setHardTickets] = useState([]);
    const [hardTicketFilters, setHardTicketFilters] = useState({});
    const [loading, setLoading] = useState(false);
    const [totalLeads, setTotalLeads] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(50);
    const [searchTerm, setSearchTerm] = useState("");

    const hardReqIdRef = useRef(0);

    const hasHardFilters = useMemo(() => {
        return Object.values(hardTicketFilters).some(
            (v) =>
                v !== undefined &&
                v !== null &&
                v !== "" &&
                (!Array.isArray(v) || v.length > 0) &&
                (typeof v !== "object" || Object.keys(v).length > 0)
        );
    }, [hardTicketFilters]);

    const fetchHardTickets = useCallback(async (page = 1) => {
        if (!groupTitleForApi || !workflowOptions.length) return;

        const reqId = ++hardReqIdRef.current;
        try {
            setLoading(true);

            const excludedWorkflows = ["Realizat cu succes", "Închis și nerealizat", "Auxiliar"];
            const isSearchingInList = !!searchTerm?.trim();

            const effectiveWorkflow =
                hardTicketFilters.workflow?.length > 0
                    ? hardTicketFilters.workflow
                    : isSearchingInList
                        ? workflowOptions
                        : workflowOptions.filter((w) => !excludedWorkflows.includes(w));

            const { search, group_title, workflow, type, view, ...restFilters } = hardTicketFilters;

            const response = await api.tickets.filters({
                page,
                type: "hard",
                group_title: groupTitleForApi,
                sort_by: "creation_date",
                order: "DESC",
                limit: perPage,
                attributes: {
                    ...restFilters,
                    workflow: effectiveWorkflow,
                    ...(search?.trim() ? { search: search.trim() } : {}),
                },
            });

            if (reqId !== hardReqIdRef.current) return;

            setHardTickets(response.data);
            setTotalLeads(response.pagination?.total || 0);
        } catch (error) {
            if (reqId === hardReqIdRef.current) {
                enqueueSnackbar(showServerError(error), { variant: "error" });
            }
        } finally {
            if (reqId === hardReqIdRef.current) {
                setLoading(false);
            }
        }
    }, [enqueueSnackbar, groupTitleForApi, workflowOptions, hardTicketFilters, perPage, searchTerm]);

    // useLeadsTable.js
    const handleApplyFiltersHardTicket = useCallback((selectedFilters) => {
        setHardTicketFilters((prev) => {
            const hasWorkflow =
                selectedFilters.workflow && selectedFilters.workflow.length > 0;

            const nextWorkflow =
                typeof selectedFilters.workflow === "string"
                    ? [selectedFilters.workflow]
                    : selectedFilters.workflow;

            // собираем next из prev, но НЕ кладём prev в зависимости коллбека
            const next = {
                ...prev,
                ...selectedFilters,
                workflow: hasWorkflow ? nextWorkflow : workflowOptions,
            };

            return next;
        });

        setCurrentPage(1);
    }, [workflowOptions]); // <— только workflowOptions, без hardTicketFilters

    const handlePerPageChange = useCallback((next) => {
        const n = Number(next);
        if (!n || n === perPage) return;
        setCurrentPage(1);
        setPerPage(n);
    }, [perPage]);

    return {
        // data
        hardTickets,
        hardTicketFilters,
        loading,
        totalLeads,
        currentPage,
        perPage,
        hasHardFilters,
        searchTerm,

        // actions
        fetchHardTickets,
        setHardTicketFilters,
        setCurrentPage,
        setSearchTerm,
        handleApplyFiltersHardTicket,
        handlePerPageChange,
    };
};
