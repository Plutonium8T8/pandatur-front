import { useMemo } from "react";
import { Box, Flex, Pagination, Badge, ActionIcon } from "@mantine/core";
import { RcTable } from "../RcTable";
import { getLanguageByKey } from "@utils";
import { format } from "date-fns";
import { FaDownload } from "react-icons/fa";
import { Spin } from "@components";

const formatDate = (ts) => {
    if (!ts) return "-";
    try {
        return format(new Date(ts * 1000), "dd.MM.yyyy HH:mm:ss");
    } catch {
        return "-";
    }
};

export const CallListTable = ({
    data = [],
    pagination,
    onPageChange,
    loading,
    techniciansMap,
}) => {
    const columns = useMemo(() => [
        {
            title: "Дата/Время",
            dataIndex: "timestamp",
            width: 180,
            render: (ts) => (
                <span style={{ fontFamily: "monospace" }}>{formatDate(ts)}</span>
            ),
        },
        {
            title: "Техник",
            dataIndex: "user_id",
            width: 200,
            render: (userId) => techniciansMap.get(String(userId)) || userId,
        },
        {
            title: "Номер клиента",
            dataIndex: "client_fullname",
            width: 160,
            render: (val) => val || "-",
        },
        {
            title: "Тикет",
            dataIndex: "ticket_id",
            width: 110,
            render: (id) => id || "-",
        },
        {
            title: "Кто звонил",
            dataIndex: "who_called",
            width: 120,
            render: (v) =>
                v === "user"
                    ? <Badge color="blue">Техник</Badge>
                    : v === "client"
                        ? <Badge color="green">Клиент</Badge>
                        : v,
        },
        {
            title: "Статус",
            dataIndex: "status",
            width: 110,
            render: (v) =>
                v === "ANSWER"
                    ? <Badge color="teal">Ответ</Badge>
                    : v === "NOANSWER"
                        ? <Badge color="red">Нет ответа</Badge>
                        : v,
        },
        {
            title: "Запись",
            dataIndex: "call_url",
            width: 110,
            render: (url) =>
                url
                    ? (
                        <ActionIcon
                            component="a"
                            href={url}
                            target="_blank"
                            color="blue"
                            variant="light"
                            title="Скачать/Послушать"
                        >
                            <FaDownload size={16} />
                        </ActionIcon>
                    )
                    : <span style={{ color: "#888" }}>—</span>,
        },
    ], [techniciansMap]);

    return (
        <Box p={"xs"}>
            <RcTable
                columns={columns}
                data={data}
                bordered
                loading={loading}
                scroll={{ y: "calc(100vh - 250px)" }}
            />

            <Flex justify="center" mt="md">
                <Pagination
                    total={pagination?.total_pages || 1}
                    value={pagination?.page || 1}
                    onChange={onPageChange}
                />
            </Flex>
        </Box>
    );
};
