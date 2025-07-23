import { Box, Flex, Pagination, ActionIcon, Text, TextInput } from "@mantine/core";
import { useState, useEffect } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { enqueueSnackbar } from "notistack";
import { PageHeader, Spin } from "@components";
import { getLanguageByKey, showServerError, cleanValue } from "@utils";
import { api } from "../api";
import { RcTable } from "../Components/RcTable";
import { DateCell } from "../Components/DateCell";
import { LogFilterModal } from "../Components/LogsComponent/LogFilterModal";
import { useGetTechniciansList } from "../hooks";
import { LuFilter } from "react-icons/lu";
import { getChangedFields, isFilterActive } from "../Components/utils/logsUtils";

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
  const [search, setSearch] = useState(filters.search || "");
  const [debouncedSearch] = useDebouncedValue(search, 400);

  const { technicians, loading: loadingTechs } = useGetTechniciansList();

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await api.activity.filterLogs({
          page: pagination.currentPage,
          limit: 50,
          sort_by: "id",
          order: "DESC",
          attributes: {
            ...filters,
            search: debouncedSearch ? debouncedSearch : undefined,
          },
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
  }, [pagination.currentPage, filters, debouncedSearch]);

  const handleApplyFilter = (attrs) => {
    setFilters(attrs);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    // Если нужно сбрасывать поиск при смене фильтра, раскомментируй:
    setSearch("");
  };

  const getNameById = (userId) => {
    const tech = technicians?.find((t) => String(t.id?.id) === String(userId));
    return tech?.label || userId;
  };

  const rcColumn = [
    {
      width: 70,
      key: "id",
      title: "ID",
      dataIndex: "id",
      align: "center",
    },
    {
      width: 160,
      key: "timestamp",
      title: getLanguageByKey("Data și ora log-ului"),
      dataIndex: "timestamp",
      align: "center",
      render: (timestamp) =>
        <DateCell gap="8" direction="row" date={timestamp} justify="center" />,
    },
    {
      width: 220,
      key: "user_identifier",
      title: getLanguageByKey("Identificator utilizator"),
      dataIndex: "user_identifier",
      align: "center",
    },
    {
      width: 180,
      key: "event",
      title: getLanguageByKey("LogEvent"),
      dataIndex: "object",
      align: "center",
      render: (object, record) =>
        object?.type
          ? object.type
          : record.event || cleanValue(),
    },
    {
      width: 500,
      key: "changes",
      title: getLanguageByKey("Detalii"),
      dataIndex: "data",
      align: "left",
      render: (data, record) => {
        const obj = record.object || {};
        const hasObjInfo = obj?.id || obj?.type;
        const objectIdLabel =
          obj.id && !loadingTechs ? getNameById(obj.id) : obj.id || "-";

        if (!data) {
          return (
            <Box>
              {hasObjInfo && (
                <Text size="md" mb={4}>
                  <b>{getLanguageByKey("Tip:")}</b> {obj.type ? obj.type : "-"}<b> </b>
                  <b>{getLanguageByKey("ID obiect:")}</b> {objectIdLabel}{" "}
                </Text>
              )}
              <Text size="md">{getLanguageByKey("Fără modificări")}</Text>
            </Box>
          );
        }
        const changes = getChangedFields(data.before, data.after);
        if (changes.length === 0) {
          return (
            <Box>
              {hasObjInfo && (
                <Text size="md" mb={4}>
                  <b>{getLanguageByKey("Tip:")}</b> {obj.type ? obj.type : "-"}<b> </b>
                  <b>{getLanguageByKey("ID obiect:")}</b> {objectIdLabel}{" "}
                </Text>
              )}
              <Text size="md">{getLanguageByKey("Fără modificări")}</Text>
            </Box>
          );
        }
        return (
          <Box>
            {hasObjInfo && (
              <Text size="md" mb={4}>
                <b>{getLanguageByKey("Tip:")}</b> {obj.type ? obj.type : "-"}<b> </b>
                <b>{getLanguageByKey("ID obiect:")}</b> {objectIdLabel}{" "}
              </Text>
            )}
            {changes.map((ch, i) =>
              <Text size="md" key={i}>
                <b>{ch.field}:</b>{" "}
                <span style={{ color: "red" }}>{String(ch.from)}</span>
                <span style={{
                  fontWeight: 700,
                  color: "#bbb",
                  margin: "0 6px"
                }}>→</span>
                <span style={{ color: "green" }}>{String(ch.to)}</span>
              </Text>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Box h="calc(100% - (32px + 33px + 32px))" p="20px">
      <Flex align="center" justify="space-between" mb={20}>
        <PageHeader title={getLanguageByKey("logs")} count={totalItems} />
        <Flex align="center" gap={8}>
          <ActionIcon
            variant={isFilterActive(filters) ? "filled" : "default"}
            color={isFilterActive(filters) ? "#0f824c" : "gray"}
            size="lg"
            onClick={() => setFilterModalOpen(true)}
            title="Фильтр"
          >
            <LuFilter size={22} />
          </ActionIcon>
          <TextInput
            w={350}
            placeholder={getLanguageByKey("Search text")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ minWidth: 260 }}
          />
        </Flex>
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
          <RcTable
            bordered
            rowKey="id"
            columns={rcColumn}
            data={logList}
            scroll={{ y: 'calc(100vh - 220px)' }}
          />
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
