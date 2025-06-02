import { Box, Flex, Pagination } from "@mantine/core";
import { enqueueSnackbar } from "notistack";
import { useState, useEffect } from "react";
import { PageHeader, Spin } from "@components";
import { getLanguageByKey, showServerError } from "@utils";
import { api } from "../api";
import { LogsComponent } from "../Components/LogsComponent/LogsComponent";

export const Logs = () => {
  const [logList, setLogList] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await api.activity.filterLogs({
          page: pagination.currentPage,
          limit: 50,
          sort_by: "timestamp",
          order: "DESC",
          attributes: {},
        });

        setLogList(response.data);
        setTotalItems(response.pagination.total);
        setPagination({
          currentPage: response.pagination.page,
          totalPages: response.pagination.total_pages,
        });
      } catch (error) {
        enqueueSnackbar(showServerError(error), { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [pagination.currentPage]);

  return (
    <Box h="calc(100% - (32px + 33px + 32px))" p="20px">
      <PageHeader title={getLanguageByKey("logs")} count={totalItems} />

      {loading ? (
        <Flex h="100%" align="center" justify="center">
          <Spin />
        </Flex>
      ) : (
        <>
          <LogsComponent logList={logList} />

          <Flex
            pt="20"
            justify="center"
            style={{ borderTop: "1px solid var(--mantine-color-gray-4)" }}
          >
            <Pagination
              total={pagination.totalPages}
              value={pagination.currentPage}
              onChange={(page) =>
                setPagination((prev) => ({ ...prev, currentPage: page }))
              }
            />
          </Flex>
        </>
      )}
    </Box>
  );
};
