import { useEffect, useState, useMemo } from "react";
import { Box, Flex, ActionIcon, TextInput, Pagination, Tooltip } from "@mantine/core";
import { activity } from "../../api/activity";
import { RcTable } from "../RcTable";
import { getLanguageByKey } from "../utils";
import { LuFilter } from "react-icons/lu";
import { PageHeader } from "../PageHeader";

const COLORS = {
    total: "#0f824c",
    bgMain: "white",
};

const PAGE_SIZE = 20;

export const EventsList = () => {
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        total_pages: 1
    });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [searchValue, setSearchValue] = useState("");

    const EVENT_FILTER = ["Lead", "Task", "Client"];

    const fetchData = async (page = 1) => {
        setLoading(true);
        try {
            const res = await activity.filterLogs({
                page,
                limit: PAGE_SIZE,
                attributes: { event: EVENT_FILTER }
            });
            setData(res.data || []);
            setPagination({
                page: res.pagination.page,
                limit: res.pagination.limit,
                total: res.pagination.total,
                total_pages: res.pagination.total_pages
            });
        } catch (e) {
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(1);
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => setSearchValue(search), 350);
        return () => clearTimeout(timeout);
    }, [search]);

    const filteredData = useMemo(() => {
        if (!searchValue) return data || [];
        const searchLC = searchValue.toLowerCase();
        return (data || []).filter((row) => {
            return (
                (row.user_identifier || "").toLowerCase().includes(searchLC) ||
                (row.ip_address || "").toLowerCase().includes(searchLC) ||
                (row.event || "").toLowerCase().includes(searchLC) ||
                (row.object?.type || "").toLowerCase().includes(searchLC)
            );
        });
    }, [searchValue, data]);

    const columns = [
        {
            title: getLanguageByKey("ID"),
            dataIndex: "id",
            width: 70,
            align: "center",
        },
        {
            title: getLanguageByKey("User"),
            dataIndex: "user_identifier",
            width: 180,
        },
        {
            title: getLanguageByKey("IP Address"),
            dataIndex: "ip_address",
            width: 150,
        },
        {
            title: getLanguageByKey("DateTime"),
            dataIndex: "timestamp",
            width: 170,
        },
        {
            title: getLanguageByKey("Event"),
            dataIndex: "event",
            width: 100,
            align: "center"
        },
        {
            title: getLanguageByKey("Object Type"),
            dataIndex: ["object", "type"],
            render: (_, row) => row.object?.type || "-",
            width: 180,
        },
        {
            title: getLanguageByKey("Object ID"),
            dataIndex: ["object", "id"],
            render: (_, row) => row.object?.id || "-",
            width: 100,
            align: "center",
        },
        {
            title: getLanguageByKey("Changes"),
            dataIndex: "data",
            width: 220,
            render: (_, row) => {
                const before = row.data?.before ?? {};
                const after = row.data?.after ?? {};
                const keys = Object.keys({ ...before, ...after });
                if (keys.length === 0) return "-";
                return keys.map((key) => (
                    <span key={key} style={{ color: before[key] !== after[key] ? "red" : "gray", fontSize: 12 }}>
                        {key}: {String(before[key])} → <b>{String(after[key])}</b>
                    </span>
                ));
            }
        }
    ];

    return (
        <Box
            h="calc(100vh - 24px)"
            style={{
                overflowY: "auto",
                background: COLORS.bgMain,
                minHeight: "100vh",
            }}
        >
            <Box px={32} mb={32} mt={32}>
                <Flex align="center" justify="space-between" gap={24}>
                    <PageHeader
                        title={getLanguageByKey("Events")}
                        count={pagination.total}
                        badgeColor={COLORS.total}
                        withDivider={false}
                    />
                    <Flex align="center" gap={12}>
                        <Tooltip label={getLanguageByKey("Filter")} position="bottom">
                            <ActionIcon
                                variant="default"
                                size="lg"
                                disabled
                                style={{ color: "#a6a6a6" }}
                            >
                                <LuFilter size={22} />
                            </ActionIcon>
                        </Tooltip>
                        <TextInput
                            w={320}
                            placeholder={getLanguageByKey("SearchUserOrObject") || "Поиск по пользователю, IP, событию, типу объекта"}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ minWidth: 220 }}
                        />
                    </Flex>
                </Flex>
            </Box>

            <Box px={32}>
                <RcTable
                    columns={columns}
                    data={filteredData}
                    loading={loading}
                    rowKey="id"
                    style={{ minWidth: 920 }}
                    scroll={{ y: "calc(100vh - 350px)" }}
                />
                <Flex justify="center" mt={24} mb={40}>
                    <Pagination
                        total={pagination.total_pages}
                        value={pagination.page}
                        onChange={fetchData}
                        size="md"
                    />
                </Flex>
            </Box>
        </Box>
    );
};
