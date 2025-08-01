import { useEffect } from "react";
import { Box, Group, Button, Paper } from "@mantine/core";
import { FaChartBar, FaRegCalendarCheck } from "react-icons/fa";
import { getLanguageByKey } from "../Components/utils";
import { CallStatsPage } from "./CallStatsPage";
import { EventsList } from "../Components/CallStats/EventsList";
import { useNavigate, useLocation } from "react-router-dom";

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
        <Box p={0} h="100%">
            <Paper
                radius={24}
                p={0}
                my={28}
                mx={32}
                style={{
                    background: "#222e45",
                    minHeight: 74,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Group gap={20} p={12}>
                    <Button
                        variant={tab === "calls" ? "filled" : "subtle"}
                        color="teal"
                        size="lg"
                        radius="lg"
                        leftSection={<FaChartBar size={20} />}
                        style={{
                            fontWeight: 700,
                            fontSize: 18,
                            background: tab === "calls" ? "rgba(15,130,76,0.18)" : "transparent",
                            color: tab === "calls" ? "#0f824c" : "#b7c9e2",
                            boxShadow: tab === "calls" ? "0 2px 8px 0 rgba(15,130,76,0.11)" : "none",
                            transition: "background 0.18s, color 0.18s, box-shadow 0.18s",
                        }}
                        onClick={() => handleTabChange("calls")}
                    >
                        {getLanguageByKey("Calls")}
                    </Button>
                    <Button
                        variant={tab === "events" ? "filled" : "subtle"}
                        color="teal"
                        size="lg"
                        radius="lg"
                        leftSection={<FaRegCalendarCheck size={20} />}
                        style={{
                            fontWeight: 700,
                            fontSize: 18,
                            background: tab === "events" ? "rgba(15,130,76,0.18)" : "transparent",
                            color: tab === "events" ? "#0f824c" : "#b7c9e2",
                            boxShadow: tab === "events" ? "0 2px 8px 0 rgba(15,130,76,0.11)" : "none",
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
                {tab === "events" && (
                    <EventsList />
                )}
            </div>
        </Box>
    );
};
