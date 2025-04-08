import { getLanguageByKey } from "../utils";
import { Text, Box } from "@mantine/core";
import { cleanValue, priorityTagColors } from "../utils";
import { Tag } from "../Tag";
import { WorkflowTag } from "../Workflow/components";
import { RcTable } from "../RcTable";
import { DateCell } from "../DateCell";

export const Logs = ({ logList }) => {
  const rcColumn = [
    {
      width: 100,
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
      width: 200,
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
      width: 200,
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
      render: (date) => date,
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
      width: 150,
      key: "ticket_id",
      title: getLanguageByKey("ID-ul tichetului"),
      dataIndex: ["additional_data", "ticket", "id"],
      align: "center",
      render: (ticketId) => (ticketId ? ticketId : cleanValue(ticketId)),
    },
    {
      width: 150,
      key: "workflow",
      title: getLanguageByKey("Workflow"),
      dataIndex: ["additional_data", "data", "workflow"],
      align: "center",
      render: (workflow) =>
        workflow ? <WorkflowTag type={workflow} /> : cleanValue(),
    },
    {
      width: 200,
      key: "creation_date",
      title: getLanguageByKey("created_at_ticket"),
      dataIndex: ["additional_data", "ticket", "creation_date"],
      align: "center",
      render: (creation_date) =>
        creation_date ? (
          <DateCell
            gap="8"
            direction="row"
            date={creation_date}
            justify="center"
          />
        ) : (
          cleanValue()
        ),
    },
    {
      width: 250,
      key: "last_interaction_date",
      title: getLanguageByKey("last_ticket_interaction"),
      dataIndex: ["additional_data", "ticket", "last_interaction_date"],
      align: "center",
      render: (last_interaction_date) =>
        last_interaction_date ? (
          <DateCell
            gap="8"
            direction="row"
            date={last_interaction_date}
            justify="center"
          />
        ) : (
          cleanValue()
        ),
    },
    {
      width: 150,
      key: "status",
      title: getLanguageByKey("Statusul tichetului"),
      dataIndex: ["additional_data", "ticket", "status"],
      align: "center",
      render: (status) => (
        <div className="text-center">
          {typeof status === "boolean" ? (
            <Tag type={status ? "processing" : "warning"}>
              {getLanguageByKey(status ? "activ" : "inactiv")}
            </Tag>
          ) : (
            cleanValue(status)
          )}
        </div>
      ),
    },
    {
      width: 100,
      key: "priority",
      title: getLanguageByKey("Prioritate"),
      dataIndex: ["additional_data", "ticket", "priority"],
      align: "center",
      render: (priority) =>
        priority ? (
          <Tag type={priorityTagColors[priority]}>{priority}</Tag>
        ) : (
          cleanValue()
        ),
    },
  ];

  return (
    <div style={{ overflow: "scroll", height: "100%" }}>
      <RcTable
        bordered
        rowKey="id"
        columns={rcColumn}
        column={rcColumn}
        data={logList}
      />
    </div>
  );
};
