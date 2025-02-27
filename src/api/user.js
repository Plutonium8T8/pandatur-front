import { baseAxios } from "./baseAxios";

export const user = {
  getGroupsList: async () => {
    const { data } = await baseAxios.get("/api/user-groups");

    return data;
  },

  createGroup: async (body) => {
    const { data } = await baseAxios.post("/api/user-groups", body);

    return data;
  },

  assignGroups: async (groupId, userId) => {
    const { data } = await baseAxios.patch(
      `api/user-groups/${groupId}/assign/${userId}`,
    );

    return data;
  },

  deleteGroups: async (id) => {
    await baseAxios.delete(`api/user-groups/${id}`);
  },
};
