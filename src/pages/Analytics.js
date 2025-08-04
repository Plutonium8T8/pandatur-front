import { useEffect } from "react";
import { Box, Group, Button, Paper } from "@mantine/core";
import { FaChartBar, FaRegCalendarCheck } from "react-icons/fa";
import { getLanguageByKey } from "../Components/utils";
import { CallStatsPage } from "./CallStatsPage";
import { EventsList } from "../Components/CallStats/EventsList";
import { useNavigate, useLocation } from "react-router-dom";

const COLORS = {
    main: "#0f824c",
    bg: "#fff",
    tabInactive: "#e8f3ef",
    textDark: "#232b3a",
    textInactive: "#000",
};

export const Analytics = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const tab = location.pathname.endsWith("/events") ? "events" : "calls";

    const handleTabChange = (tabValue) => {
        navigate(tabValue === "calls" ? "/analytics/calls" : "/analytics/events", { replace: true });
    };

    useEffect(() => {
        if (location.pathname === "/analytics") {
            navigate("/analytics/calls", { replace: true });
        }
    }, [location.pathname, navigate]);

    return (
        <Box p={0} h="100%" style={{ background: COLORS.bg }}>
            <Paper
                radius={24}
                p={0}
                my={28}
                mx={32}
                withBorder
                style={{
                    background: COLORS.bg,
                    minHeight: 74,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 24px 0 rgba(18,36,64,0.06)",
                }}
            >
                <Group gap={20} p={12}>
                    <Button
                        variant={tab === "calls" ? "filled" : "light"}
                        color="teal"
                        size="lg"
                        radius="lg"
                        leftSection={<FaChartBar size={20} />}
                        style={{
                            fontWeight: 700,
                            fontSize: 18,
                            background: tab === "calls" ? COLORS.tabInactive : COLORS.bg,
                            color: tab === "calls" ? COLORS.main : COLORS.textInactive,
                            boxShadow: tab === "calls" ? "0 2px 8px 0 rgba(15,130,76,0.10)" : "none",
                            border: tab === "calls" ? `1.5px solid ${COLORS.main}` : "1.5px solid transparent",
                            transition: "background 0.18s, color 0.18s, box-shadow 0.18s",
                        }}
                        onClick={() => handleTabChange("calls")}
                    >
                        {getLanguageByKey("Calls")}
                    </Button>
                    <Button
                        variant={tab === "events" ? "filled" : "light"}
                        color="teal"
                        size="lg"
                        radius="lg"
                        leftSection={<FaRegCalendarCheck size={20} />}
                        style={{
                            fontWeight: 700,
                            fontSize: 18,
                            background: tab === "events" ? COLORS.tabInactive : COLORS.bg,
                            color: tab === "events" ? COLORS.main : COLORS.textInactive,
                            boxShadow: tab === "events" ? "0 2px 8px 0 rgba(15,130,76,0.10)" : "none",
                            border: tab === "events" ? `1.5px solid ${COLORS.main}` : "1.5px solid transparent",
                            transition: "background 0.18s, color 0.18s, box-shadow 0.18s",
                        }}
                        onClick={() => handleTabChange("events")}
                    >
                        {getLanguageByKey("Events")}
                    </Button>
                </Group>
            </Paper>

            <div style={{ flex: 1, minWidth: 0 }}>
                {tab === "calls" && <CallStatsPage />}
                {tab === "events" && <EventsList />}
            </div>
        </Box>
    );
};
