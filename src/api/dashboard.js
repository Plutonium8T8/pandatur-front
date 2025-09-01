import queryString from "query-string";
import { baseAxios } from "./baseAxios";

export const dashboard = {
  statistics: async (params, id) => {
    const url = queryString.stringifyUrl(
      {
        url: "/api/dashboard/statistics",
        query: params,
      },
      { skipNull: true, skipEmptyString: true }
    );
    const { data } = await baseAxios.post(url, { user_id: id });
    return data;
  },

  updateGraphById: async (id, body) => {
    const { data } = await baseAxios.patch(`/api/graph/${id}`, body);
    return data;
  },

  getCallStats: async (body) => {
    const { data } = await baseAxios.post("/api/filter/call-stats", body);
    return data;
  },

  getWidgetCalls: async (body) => {
    const { data } = await baseAxios.post("/api/dashboard/widget/calls", body);
    return data;
  },

  getWidgetMessages: async (body) => {
    const { data } = await baseAxios.post("/api/dashboard/widget/messages", body);
    return data;
  },
};
