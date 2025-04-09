import { Box, Flex, Pagination } from "@mantine/core";
import { enqueueSnackbar } from "notistack";
import { useState, useEffect } from "react";
import { Logs as LogsComponent, PageHeader, Spin } from "../Components";
import { getLanguageByKey, showServerError } from "../Components/utils";
import { api } from "../api";

export const Logs = () => {
  const [logList, setLogList] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
  });
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const getLogList = async () => {
      setLoading(true);
      try {
        const logs = await api.activity.getLogs({
          page: pagination.currentPage,
        });
        setLogList(logs.data);
        setTotalItems(logs.meta.totalItems);
        setPagination({
          totalPages: logs.meta.totalPages,
          currentPage: logs.meta.currentPage,
        });
      } catch (error) {
        enqueueSnackbar(showServerError(error), { variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    getLogList();
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

          <Flex pt="20" justify="center">
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
