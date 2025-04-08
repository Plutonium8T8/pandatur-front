import { baseAxios } from "./baseAxios";

export const user = {
  getGroupsList: async () => {
    const { data } = await baseAxios.get("/api/user-groups");
    return data;
  },

  createGroup: async ({ group_name, supervisor_id, user_ids }) => {
    const { data } = await baseAxios.post("/api/user-groups", {
      group_name,
      supervisor_id,
      user_ids
    });
    return data;
  },

  updateGroupByName: async ({ group_name, supervisor_id, user_ids }) => {
    const { data } = await baseAxios.patch("/api/user-groups/update", {
      group_name,
      supervisor_id,
      user_ids
    });
    return data;
  },

  deleteGroups: async (id) => {
    const { data } = await baseAxios.delete(`/api/user-groups/${id}`);
    return data;
  },

  assignTechnicianToGroup: async (groupId, userId) => {
    const { data } = await baseAxios.post(`/api/user-groups/${groupId}/assign/${userId}`);
    return data;
  },

  removeTechnicianFromGroup: async (groupId, userId) => {
    const { data } = await baseAxios.delete(`/api/user-groups/${groupId}/remove/${userId}`);
    return data;
  }
};
