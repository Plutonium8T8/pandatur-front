export const formatRoles = (roles) => {
  if (Array.isArray(roles)) return roles;
  if (typeof roles === "object" && roles !== null) return Object.values(roles);
  return [];
};
