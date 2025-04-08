import { Box, Flex } from "@mantine/core";
import { enqueueSnackbar } from "notistack";
import { useState, useEffect } from "react";
import { Logs as LogsComponent, PageHeader, Spin } from "../Components";
import { getLanguageByKey, showServerError } from "../Components/utils";
import { api } from "../api";

export const Logs = () => {
  const [logList, setLogList] = useState([]);
  const [pagination, setPagination] = useState();
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const getLogList = async () => {
      setLoading(true);
      try {
        const logs = await api.activity.getLogs();
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
  }, [pagination?.currentPage]);

  return (
    <Box h="calc(100% - (32px + 33px))" p="20px">
      <PageHeader title={getLanguageByKey("logs")} count={totalItems} />

      {loading ? (
        <Flex h="100%" align="center" justify="center">
          <Spin />
        </Flex>
      ) : (
        <LogsComponent logList={logList} />
      )}
    </Box>
  );
};
