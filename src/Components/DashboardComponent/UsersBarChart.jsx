import React, { useMemo } from "react";
import { Card, Text } from "@mantine/core";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement,
    Title as ChartTitle, Tooltip, Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend);

export const UsersBarChart = ({ users = [] }) => {
    const { data, options } = useMemo(() => {
        const labels = users.map((u) => u.username || `ID ${u.user_id}`);
        const incoming = users.map((u) => u.incoming_calls || 0);
        const outgoing = users.map((u) => u.outgoing_calls || 0);
        return {
            data: {
                labels,
                datasets: [
                    { label: "Incoming", data: incoming, backgroundColor: "rgba(34, 197, 94, 0.5)", borderColor: "rgba(34, 197, 94, 1)", borderWidth: 1 },
                    { label: "Outgoing", data: outgoing, backgroundColor: "rgba(59, 130, 246, 0.5)", borderColor: "rgba(59, 130, 246, 1)", borderWidth: 1 },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "top" }, title: { display: false }, tooltip: { mode: "index", intersect: false } },
                interaction: { mode: "nearest", intersect: false },
                scales: { x: { ticks: { maxRotation: 0, minRotation: 0, autoSkip: true, font: { size: 12 } } }, y: { beginAtZero: true, ticks: { precision: 0 } } },
            },
        };
    }, [users]);

    return (
        <Card withBorder radius="lg" p="lg" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Text size="sm" c="dimmed" style={{ marginBottom: 8 }}>Пользователи: входящие vs исходящие</Text>
            <div style={{ width: "100%", height: "100%" }}>
                <Bar data={data} options={options} />
            </div>
        </Card>
    );
};
