import { Box, Text } from "@mantine/core";
import { RcTable } from "../RcTable";
import { DateCell } from "../DateCell";
import { cleanValue, getLanguageByKey } from "../utils";

const parsePossibleJson = (str) => {
  try {
    if (typeof str === "string" && str.startsWith("[") && str.endsWith("]")) {
      return JSON.parse(str);
    }
    return str;
  } catch {
    return str;
  }
};

const arrayDiff = (before, after) => {
  const beforeArr = Array.isArray(before) ? before : [];
  const afterArr = Array.isArray(after) ? after : [];
  const removed = beforeArr.filter((item) => !afterArr.includes(item));
  const added = afterArr.filter((item) => !beforeArr.includes(item));
  return { removed, added };
};

const getChangedFields = (before = {}, after = {}) => {
  if (!before || !after) return [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes = [];
  for (const key of allKeys) {
    const valBefore = parsePossibleJson(before[key]);
    const valAfter = parsePossibleJson(after[key]);
    if (Array.isArray(valBefore) && Array.isArray(valAfter)) {
      const diff = arrayDiff(valBefore, valAfter);
      if (diff.removed.length || diff.added.length) {
        changes.push({
          field: key,
          from: diff.removed.length ? diff.removed.join(", ") : "-",
          to: diff.added.length ? diff.added.join(", ") : "-",
          type: "array",
        });
      }
    } else if (valBefore !== valAfter) {
      changes.push({
        field: key,
        from: valBefore ?? "-",
        to: valAfter ?? "-",
      });
    }
  }
  return changes;
};

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
    // Если понадобится — раскомментируй ниже
    // {
    //   width: 100,
    //   key: "user_id",
    //   title: getLanguageByKey("ID-ul utilizatorului"),
    //   dataIndex: "user_id",
    //   align: "center",
    // },
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
    // {
    //   width: 150,
    //   key: "ip_address",
    //   title: getLanguageByKey("Adresă IP"),
    //   dataIndex: "ip_address",
    //   align: "center",
    // },
    {
      width: 500,
      key: "changes",
      title: getLanguageByKey("Detalii"),
      dataIndex: "data",
      align: "left",
      render: (data, record) => {
        const obj = record.object || {};
        const hasObjInfo = obj?.id || obj?.type;
        if (!data) {
          return (
            <Box>
              {hasObjInfo && (
                <Text size="xs" mb={4}>
                  <b>{getLanguageByKey("ID obiect:")}</b> {obj.id ? obj.id : "-"}{" "}
                  <b>{getLanguageByKey("Tip:")}</b> {obj.type ? obj.type : "-"}
                </Text>
              )}
              <Text size="sm">{getLanguageByKey("Fără modificări")}</Text>
            </Box>
          );
        }
        const changes = getChangedFields(data.before, data.after);
        if (changes.length === 0) {
          return (
            <Box>
              {hasObjInfo && (
                <Text size="xs" mb={4}>
                  <b>{getLanguageByKey("ID obiect:")}</b> {obj.id ? obj.id : "-"}{" "}
                  <b>{getLanguageByKey("Tip:")}</b> {obj.type ? obj.type : "-"}
                </Text>
              )}
              <Text size="sm">{getLanguageByKey("Fără modificări")}</Text>
            </Box>
          );
        }
        return (
          <Box>
            {hasObjInfo && (
              <Text size="xs" mb={4}>
                <b>{getLanguageByKey("ID obiect:")}</b> {obj.id ? obj.id : "-"}{" "}
                <b>{getLanguageByKey("Tip:")}</b> {obj.type ? obj.type : "-"}
              </Text>
            )}
            {changes.map((ch, i) =>
              <Text size="xs" key={i}>
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
    <RcTable
      bordered
      rowKey="id"
      columns={rcColumn}
      data={logList}
      scroll={{ y: 'calc(100vh - 220px)' }}
    />
  );
};
