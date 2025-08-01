import { useEffect } from "react";
import { Box, Tabs } from "@mantine/core";
import { FaChartBar, FaRegCalendarCheck } from "react-icons/fa";
import { getLanguageByKey } from "../Components/utils";
import { CallStatsPage } from "./CallStatsPage";
// import { EventsList } from "./EventsList";
import { useNavigate, useLocation } from "react-router-dom";

export const Analytics = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Определяем активный таб из url
    const tab = location.pathname.endsWith("/events") ? "events" : "calls";

    // Когда пользователь переключает таб — меняем url
    const handleTabChange = (tabValue) => {
        navigate(tabValue === "calls" ? "/analytics/calls" : "/analytics/events", { replace: true });
    };

    // Если пользователь зашёл просто по /analytics, то редиректим на calls (по дефолту)
    useEffect(() => {
        if (location.pathname === "/analytics") {
            navigate("/analytics/calls", { replace: true });
        }
    }, [location.pathname, navigate]);

    return (
        <Box p={0} h="100%">
            <Tabs
                value={tab}
                onChange={handleTabChange}
                variant="outline"
                color="teal"
                radius="md"
            >
                <Tabs.List>
                    <Tabs.Tab value="calls" leftSection={<FaChartBar size={18} />}>
                        {getLanguageByKey("Calls")}
                    </Tabs.Tab>
                    <Tabs.Tab value="events" leftSection={<FaRegCalendarCheck size={18} />}>
                        {getLanguageByKey("Events")}
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="calls" pt="md">
                    <CallStatsPage />
                </Tabs.Panel>
                <Tabs.Panel value="events" pt="md">
                    {/* <EventsList /> */}
                    <div style={{ padding: 24, textAlign: "center", color: "#888" }}>
                        {getLanguageByKey("NoEventsYet")}
                    </div>
                </Tabs.Panel>
            </Tabs>
        </Box>
    );
};
