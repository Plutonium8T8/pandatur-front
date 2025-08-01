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
            title: getLanguageByKey("DateTime"),
            dataIndex: "timestamp",
            width: 180,
            render: (ts) => (
                <span style={{ fontFamily: "monospace" }}>{formatDate(ts)}</span>
            ),
        },
        {
            title: getLanguageByKey("Users"),
            dataIndex: "user_id",
            width: 200,
            render: (userId) => techniciansMap.get(String(userId)) || userId,
        },
        {
            title: getLanguageByKey("ClientNumber"),
            dataIndex: "client_fullname",
            width: 160,
            render: (val) => val || "-",
        },
        {
            title: getLanguageByKey("Ticket"),
            dataIndex: "ticket_id",
            width: 110,
            render: (id) => id || "-",
        },
        {
            title: getLanguageByKey("WhoCalled"),
            dataIndex: "who_called",
            width: 120,
            render: (v) =>
                v === "user"
                    ? <Badge color="blue">{getLanguageByKey("User")}</Badge>
                    : v === "client"
                        ? <Badge color="green">{getLanguageByKey("Client")}</Badge>
                        : v,
        },
        {
            title: getLanguageByKey("Status"),
            dataIndex: "status",
            width: 110,
            render: (v) =>
                v === "ANSWER"
                    ? <Badge color="teal">{getLanguageByKey("Answer")}</Badge>
                    : v === "NOANSWER"
                        ? <Badge color="red">{getLanguageByKey("NoAnswer")}</Badge>
                        : v,
        },
        {
            title: getLanguageByKey("Record"),
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
                            title={getLanguageByKey("DownloadListen")}
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
                scroll={{ y: "calc(100vh - 350px)" }}
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
