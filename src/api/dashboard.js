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

  getTicketStateWidget: async (body) => {
    const { data } = await baseAxios.post("/api/dashboard/widget/ticket-state", body);
    return data;
  },

  getTicketsIntoWorkWidget: async (body) => {
    const { data } = await baseAxios.post("/api/dashboard/widget/tickets-into-work", body);
    return data;
  },

  getSystemUsageWidget: async (body) => {
    const { data } = await baseAxios.post("/api/dashboard/widget/system-usage", body);
    return data;
  },

  getTicketDistributionWidget: async (body) => {
    const { data } = await baseAxios.post("/api/dashboard/widget/ticket-distribution", body);
    return data;
  },

  getClosedTicketsCountWidget: async (body) => {
    const { data } = await baseAxios.post("/api/dashboard/widget/closed-tickets-count", body);
    return data;
  },

  getTicketsByDepartCountWidget: async (body) => {
    const { data } = await baseAxios.post("/api/dashboard/widget/tickets-by-depart-count", body);
    return data;
  },

  getTicketLifetimeStatsWidget: async (body) => {
    const { data } = await baseAxios.post("/api/dashboard/widget/tickets-lifetime-stats", body);
    return data;
  },
};
