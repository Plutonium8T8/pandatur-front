export const formatRoles = (roles) => {
  try {
    if (Array.isArray(roles)) return roles;
    if (typeof roles === "string") {
      const parsed = JSON.parse(roles);
      return Array.isArray(parsed) ? parsed : [];
    }
    if (typeof roles === "object" && roles !== null) {
      return Object.values(roles);
    }
  } catch (e) {
    console.warn("error parse", e);
  }
  return [];
};
