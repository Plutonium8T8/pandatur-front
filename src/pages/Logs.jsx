import { Box, Flex, Pagination, ActionIcon } from "@mantine/core";
import { useState, useEffect } from "react";
import { enqueueSnackbar } from "notistack";
import { PageHeader, Spin } from "@components";
import { getLanguageByKey, showServerError } from "@utils";
import { api } from "../api";
import { LogsComponent } from "../Components/LogsComponent/LogsComponent";
import { LogFilterModal } from "../Components/LogsComponent/LogFilterModal";
import { LuFilter } from "react-icons/lu";

const isFilterActive = (filters) => {
  if (!filters) return false;
  return Object.entries(filters).some(([key, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object" && value !== null)
      return Object.keys(value).length > 0;
    return value !== undefined && value !== null && value !== "";
  });
};

export const Logs = () => {
  const [logList, setLogList] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await api.activity.filterLogs({
          page: pagination.currentPage,
          limit: 50,
          sort_by: "id",
          order: "DESC",
          attributes: filters,
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
  }, [pagination.currentPage, filters]);

  const handleApplyFilter = (attrs) => {
    setFilters(attrs);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  return (
    <Box h="calc(100% - (32px + 33px + 32px))" p="20px">
      <Flex align="center" justify="space-between" mb={20}>
        <PageHeader title={getLanguageByKey("logs")} count={totalItems} />
        <ActionIcon
          variant={isFilterActive(filters) ? "filled" : "default"}
          color={isFilterActive(filters) ? "#0f824c" : "gray"}
          size="lg"
          onClick={() => setFilterModalOpen(true)}
          title="Фильтр"
        >
          <LuFilter size={22} />
        </ActionIcon>
      </Flex>

      <LogFilterModal
        opened={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        onApply={handleApplyFilter}
      />

      {loading ? (
        <Flex h="100%" align="center" justify="center">
          <Spin />
        </Flex>
      ) : (
        <>
          <LogsComponent logList={logList} />

          <Flex
            pt="10"
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
