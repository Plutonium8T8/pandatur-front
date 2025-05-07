export const hasPermission = (roleList, module, action) => {
    if (!Array.isArray(roleList)) return false;

    const levels = ["ALLOWED", "TEAM", "IFRESPONSIBLE"];
    return levels.some((level) => roleList.includes(`ROLE_${module}_${action}_${level}`));
};

export const parseRolesString = (rolesArray) => {
    const roleMap = {};

    rolesArray.forEach((str) => {
        if (!str.startsWith("ROLE_")) return;

        const parts = str.replace("ROLE_", "").split("_");
        const [module, action, levelRaw] = parts;
        const key = `${capitalize(module.toLowerCase())}_${capitalize(action.toLowerCase())}`;
        const level = formatLevel(levelRaw);

        roleMap[key] = level;
    });

    return roleMap;
};

const formatLevel = (level) => {
    const map = {
        denied: "Denied",
        ifresponsible: "If responsible",
        team: "Team-wide access",
        allowed: "Allowed",
    };
    return map[level.toLowerCase()] || "Denied";
};

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
