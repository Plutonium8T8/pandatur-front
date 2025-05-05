export const categories = [
    "USERS",
    "CHAT",
    "LEAD",
    "DASHBOARD",
    "NOTIFI",
    "TASK",
    "SCHEDULES",
];

export const actions = ["CREATE", "VIEW", "EDIT", "DELETE"];

export const levels = [
    { label: "Denied", value: "Denied", color: "#fa5252" },
    { label: "If responsible", value: "IfResponsible", color: "#fab005" },
    { label: "Team-wide access", value: "Team", color: "#228be6" },
    { label: "Allowed", value: "Allowed", color: "#40c057" },
];

export const LEVEL_VALUES = {
    Denied: "DENIED",
    IfResponsible: "IFRESPONSIBLE",
    Team: "TEAM",
    Allowed: "ALLOWED",
};
