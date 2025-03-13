import queryString from "query-string"
import { baseAxios } from "./baseAxios"

export const dashboard = {
  statistics: async (params) => {
    const url = queryString.stringifyUrl(
      {
        url: "/api/dashboard/statistics",
        query: params
      },
      { skipNull: true, skipEmptyString: true }
    )
    const { data } = await baseAxios.get(url)

    return data
  },

  updateGraphById: async (id, body) => {
    const { data } = await baseAxios.patch(`/api/graph/${id}`, body)

    return data
  }
}
