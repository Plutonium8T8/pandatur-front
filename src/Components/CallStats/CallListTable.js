import { useMemo } from "react";
import { Box, Flex, Pagination, Badge, ActionIcon, LoadingOverlay, Loader, Text } from "@mantine/core";
import { RcTable } from "../RcTable";
import { getLanguageByKey } from "@utils";
import { format } from "date-fns";
import { FaDownload } from "react-icons/fa";

const formatDate = (ts) => {
    if (!ts) return "-";
    try {
        return format(new Date(ts * 1000), "dd.MM.yyyy HH:mm:ss");
    } catch {
        return "-";
    }
};

// форматирование duration (секунды → чч:мм:сс)
const formatDuration = (totalSeconds = 0) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return [
        h > 0 ? String(h).padStart(2, "0") : null,
        String(m).padStart(2, "0"),
        String(s).padStart(2, "0"),
    ]
        .filter(Boolean)
        .join(":");
};

export const CallListTable = ({
    data = [],
    pagination,
    onPageChange,
    loading,
    techniciansMap,
}) => {
    const columns = useMemo(
        () => [
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
                title: getLanguageByKey("Client"),
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
                    v === "user" ? (
                        <Badge color="blue">{getLanguageByKey("User")}</Badge>
                    ) : v === "client" ? (
                        <Badge color="green">{getLanguageByKey("Client")}</Badge>
                    ) : (
                        v
                    ),
            },
            {
                title: getLanguageByKey("Status"),
                dataIndex: "status",
                width: 110,
                render: (v) =>
                    v === "ANSWER" ? (
                        <Badge color="teal">{getLanguageByKey("Answer")}</Badge>
                    ) : v === "NOANSWER" ? (
                        <Badge color="red">{getLanguageByKey("NoAnswer")}</Badge>
                    ) : (
                        v
                    ),
            },
            {
                title: getLanguageByKey("Record"),
                key: "record",
                width: 140,
                render: (_, record) =>
                    record.call_url ? (
                        <Flex align="center" gap={8}>
                            <ActionIcon
                                component="a"
                                href={record.call_url}
                                target="_blank"
                                color="blue"
                                variant="light"
                                title={getLanguageByKey("DownloadListen")}
                            >
                                <FaDownload size={16} />
                            </ActionIcon>
                            {record.duration != null && (
                                <Text size="sm" c="dimmed">
                                    {formatDuration(record.duration)}
                                </Text>
                            )}
                        </Flex>
                    ) : (
                        <span style={{ color: "#888" }}>—</span>
                    ),
            },
        ],
        [techniciansMap]
    );

    return (
        <Box p="xs" style={{ position: "relative" }}>
            <LoadingOverlay
                visible={loading}
                zIndex={10}
                overlayProps={{ blur: 1, backgroundOpacity: 0.6 }}
                loaderProps={{ children: <Loader size="lg" /> }}
            />

            <RcTable
                columns={columns}
                data={data}
                bordered
                loading={false}
                scroll={{ y: "calc(100vh - 330px)" }}
                rowKey={(_, index) => `row_${index}`}
                style={{ opacity: loading ? 0.6 : 1, transition: "opacity .15s ease" }}
            />

            <Flex justify="center" mt="md">
                <Pagination
                    total={pagination?.total_pages || 1}
                    value={pagination?.page || 1}
                    onChange={onPageChange}
                    disabled={loading}
                />
            </Flex>
        </Box>
    );
};
