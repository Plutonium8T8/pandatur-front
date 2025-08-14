import { useMemo, useRef, useState, useEffect } from "react";
import {
    Box, Flex, Pagination, Badge, ActionIcon, Text, Tooltip, Anchor
} from "@mantine/core";
import { RcTable } from "../RcTable";
import { getLanguageByKey } from "@utils";
import { format } from "date-fns";
import { FaDownload, FaPlay, FaPause } from "react-icons/fa";
import { Link } from "react-router-dom";

const formatDate = (ts) => {
    if (!ts) return "-";
    try { return format(new Date(ts * 1000), "dd.MM.yyyy HH:mm:ss"); } catch { return "-"; }
};

const formatDuration = (totalSeconds = 0) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return [h > 0 ? String(h).padStart(2, "0") : null, String(m).padStart(2, "0"), String(s).padStart(2, "0")]
        .filter(Boolean).join(":");
};

export const CallListTable = ({
    data = [],
    pagination,
    onPageChange,
    loading,
    techniciansMap,
}) => {
    const audioRef = useRef(null);
    const [playingUrl, setPlayingUrl] = useState(null);

    const [localLoading, setLocalLoading] = useState(false);

    useEffect(() => {
        // когда родительская загрузка закончилась — снимаем локальный
        if (!loading) setLocalLoading(false);
    }, [loading, data, pagination?.page]);

    useEffect(() => () => { if (audioRef.current) audioRef.current.pause(); }, []);

    const playUrl = async (url) => {
        try {
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => setPlayingUrl(null);
            await audio.play();
            setPlayingUrl(url);
        } catch { }
    };

    const togglePlay = (url) => {
        if (!url) return;
        const a = audioRef.current;
        if (playingUrl === url && a) {
            if (a.paused) { a.play().catch(() => { }); setPlayingUrl(url); }
            else { a.pause(); setPlayingUrl(null); }
        } else {
            playUrl(url);
        }
    };

    const columns = useMemo(() => [
        {
            title: getLanguageByKey("DateTime"),
            dataIndex: "timestamp",
            width: 180,
            render: (ts) => <span style={{ fontFamily: "monospace" }}>{formatDate(ts)}</span>,
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
            width: 140,
            render: (id) =>
                id ? (
                        <Anchor
                            component={Link}
                            to={`/analytics/calls/${id}`}
                            c="blue"
                            underline="always"
                            fw={600}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {id}
                        </Anchor>
                ) : "-",
        },
        {
            title: getLanguageByKey("WhoCalled"),
            dataIndex: "who_called",
            width: 120,
            render: (v) =>
                v === "user" ? <Badge color="blue">{getLanguageByKey("User")}</Badge>
                    : v === "client" ? <Badge color="green">{getLanguageByKey("Client")}</Badge>
                        : v,
        },
        {
            title: getLanguageByKey("Status"),
            dataIndex: "status",
            width: 110,
            render: (v) =>
                v === "ANSWER" ? <Badge color="teal">{getLanguageByKey("Answer")}</Badge>
                    : v === "NOANSWER" ? <Badge color="red">{getLanguageByKey("NoAnswer")}</Badge>
                        : v,
        },
        {
            title: getLanguageByKey("Record"),
            key: "record",
            width: 180,
            render: (_, record) =>
                record.call_url ? (
                    <Flex align="center" gap={8}>
                        <Tooltip label={playingUrl === record.call_url ? getLanguageByKey("Pause") : getLanguageByKey("Play")}>
                            <ActionIcon
                                color={playingUrl === record.call_url ? "teal" : "blue"}
                                variant="light"
                                onClick={(e) => { e.stopPropagation(); togglePlay(record.call_url); }}
                            >
                                {playingUrl === record.call_url ? <FaPause size={14} /> : <FaPlay size={14} />}
                            </ActionIcon>
                        </Tooltip>

                        <Tooltip label={getLanguageByKey("DownloadListen")}>
                            <ActionIcon
                                component="a"
                                href={record.call_url}
                                target="_blank"
                                color="blue"
                                variant="light"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <FaDownload size={16} />
                            </ActionIcon>
                        </Tooltip>

                        {record.duration != null && (
                            <Text size="sm" c="dimmed">{formatDuration(record.duration)}</Text>
                        )}
                    </Flex>
                ) : <span style={{ color: "#888" }}>—</span>,
        },
    ], [techniciansMap, playingUrl]);

    const handlePaginate = (p) => {
        setLocalLoading(true);
        onPageChange?.(p);
    };

    return (
        <Box p="xs">
            <RcTable
                columns={columns}
                data={data}
                bordered
                loading={loading || localLoading}
                scroll={{ y: "calc(100vh - 330px)" }}
                rowKey={(_, index) => `row_${index}`}
            />

            <Flex justify="center" mt="md" style={{ position: "relative", minHeight: 48 }}>
                <Pagination
                    total={pagination?.total_pages || 1}
                    value={pagination?.page || 1}
                    onChange={handlePaginate}
                    disabled={loading || localLoading}
                />
            </Flex>
        </Box>
    );
};
