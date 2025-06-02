import { Text, Box } from "@mantine/core";
import { cleanValue, getLanguageByKey } from "../utils";
import { RcTable } from "../RcTable";
import { DateCell } from "../DateCell";

export const LogsComponent = ({ logList }) => {
  const rcColumn = [
    {
      width: 70,
      key: "id",
      title: "ID",
      dataIndex: "id",
      align: "center",
    },
    {
      width: 300,
      key: "user_identifier",
      title: getLanguageByKey("Identificator utilizator"),
      dataIndex: "user_identifier",
      align: "center",
    },
    {
      width: 110,
      key: "user_id",
      title: getLanguageByKey("ID-ul utilizatorului"),
      dataIndex: "user_id",
      align: "center",
    },
    {
      width: 150,
      key: "activity_type",
      title: getLanguageByKey("Tip activitate"),
      dataIndex: "activity_type",
      align: "center",
    },
    {
      width: 150,
      key: "ip_address",
      title: getLanguageByKey("Adresă IP"),
      dataIndex: "ip_address",
      align: "center",
    },
    {
      width: 200,
      key: "timestamp",
      title: getLanguageByKey("Data și ora log-ului"),
      dataIndex: "timestamp",
      align: "center",
      render: (timestamp) => (
        <DateCell gap="8" direction="row" date={timestamp} justify="center" />
      ),
    },
    {
      width: 300,
      key: "user_agent",
      title: getLanguageByKey("Sistem și browser"),
      dataIndex: "user_agent",
      align: "center",
      render: (user_agent) => (
        <Box w="100%">
          <Text truncate>{user_agent ? user_agent : cleanValue()}</Text>
        </Box>
      ),
    },
    {
      width: 600,
      key: "additional_data",
      title: getLanguageByKey("Informație suplimentară"),
      dataIndex: "additional_data",
      align: "left",
      render: (data, record) => {
        if (!data) return cleanValue();

        const type = record.activity_type;

        if (type === "message_error") {
          return (
            <Box>
              <Text size="sm" fw={500}>
                {data.message}
              </Text>
              <Text size="xs" color="red">
                {data.error}
              </Text>
            </Box>
          );
        }

        if (type === "ticket_created" || type === "ticket_deleted") {
          const ticket =
            data.ticket || (Array.isArray(data.deleted_ticket) ? data.deleted_ticket[0] : null);

          if (!ticket) return cleanValue();

          return (
            <Box>
              <Text size="sm">{`ID: ${ticket.id}`}</Text>
              <Text size="sm">{`Workflow: ${ticket.workflow}`}</Text>
              <Text size="sm">{`Prioritate: ${ticket.priority}`}</Text>
            </Box>
          );
        }

        return (
          <Box style={{ whiteSpace: "pre-wrap" }}>
            <Text size="xs">{JSON.stringify(data, null, 2)}</Text>
          </Box>
        );
      },
    },
  ];

  return <RcTable bordered rowKey="id" columns={rcColumn} data={logList} />;
};
