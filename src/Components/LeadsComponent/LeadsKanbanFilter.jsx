import { Tabs, Flex, Button, TextInput, Select, MultiSelect } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useEffect, useState } from "react";
import { SelectWorkflow } from "../SelectWorkflow";
import { getLanguageByKey } from "../utils";
import { TicketFormTabs } from "../TicketFormTabs";
import { filteredWorkflows } from "./utils";
import { useGetTechniciansList } from "../../hooks";
import { MESSAGES_TYPE_OPTIONS, DD_MM_YYYY_DASH } from "../../app-constants";
import dayjs from "dayjs";

export const LeadsKanbanFilter = ({
  onClose,
  onApplyWorkflowFilters,
  loading,
  systemWorkflow: baseSystemWorkflow,
  initialData,
  onSubmitTicket,
}) => {
  const [systemWorkflow, setSystemWorkflow] = useState(filteredWorkflows);
  const [message, setMessage] = useState("");
  const [mtype, setMtype] = useState(null);
  const [senderIds, setSenderIds] = useState([]);
  const [timeSent, setTimeSent] = useState([null, null]);

  const { technicians } = useGetTechniciansList();

  useEffect(() => {
    setSystemWorkflow(baseSystemWorkflow);
  }, [baseSystemWorkflow]);

  useEffect(() => {
    if (initialData && typeof initialData === "object") {
      setMessage(initialData.message || "");
      setMtype(initialData.mtype || null);
      setSenderIds(
        Array.isArray(initialData.sender_id)
          ? initialData.sender_id.map(String)
          : typeof initialData.sender_id === "string"
            ? initialData.sender_id.split(",")
            : []
      );
      if (initialData.time_sent?.from || initialData.time_sent?.to) {
        setTimeSent([
          initialData.time_sent?.from ? dayjs(initialData.time_sent.from, DD_MM_YYYY_DASH).toDate() : null,
          initialData.time_sent?.to ? dayjs(initialData.time_sent.to, DD_MM_YYYY_DASH).toDate() : null,
        ]);
      } else {
        setTimeSent([null, null]);
      }
    }
  }, [initialData]);

  const handleApplyMessageFilter = () => {
    const filters = {};
    if (message) filters.message = message;
    if (mtype) filters.mtype = mtype;
    if (senderIds.length) filters.sender_id = senderIds.map((id) => parseInt(id, 10));
    if (timeSent?.[0] || timeSent?.[1]) {
      filters.time_sent = {
        ...(timeSent[0] && { from: dayjs(timeSent[0]).format(DD_MM_YYYY_DASH) }),
        ...(timeSent[1] && { to: dayjs(timeSent[1]).format(DD_MM_YYYY_DASH) }),
      };
    }
    onSubmitTicket(filters, "message");
  };

  const handleResetMessageFilter = () => {
    setMessage("");
    setMtype(null);
    setSenderIds([]);
    setTimeSent([null, null]);
    onSubmitTicket({}, "message");
  };

  return (
    <Tabs h="100%" className="leads-modal-filter-tabs" defaultValue="filter_workflow">
      <Tabs.List>
        {onApplyWorkflowFilters && (
          <Tabs.Tab value="filter_workflow">
            {getLanguageByKey("Filtru de sistem")}
          </Tabs.Tab>
        )}
        <Tabs.Tab value="filter_ticket">
          {getLanguageByKey("Filtru pentru Lead")}
        </Tabs.Tab>
        <Tabs.Tab value="filter_message">
          {getLanguageByKey("Filtru dupǎ mesaje")}
        </Tabs.Tab>
      </Tabs.List>

      {onApplyWorkflowFilters && (
        <Tabs.Panel value="filter_workflow" pt="xs">
          <Flex direction="column" justify="space-between" h="100%">
            <SelectWorkflow selectedValues={systemWorkflow} onChange={setSystemWorkflow} />
            <Flex justify="end" gap="md" mt="md">
              <Button variant="outline" onClick={handleResetMessageFilter}>
                {getLanguageByKey("Reset filter")}
              </Button>
              <Button variant="default" onClick={onClose}>
                {getLanguageByKey("Închide")}
              </Button>
              <Button variant="filled" loading={loading} onClick={handleApplyMessageFilter}>
                {getLanguageByKey("Aplică")}
              </Button>
            </Flex>
          </Flex>
        </Tabs.Panel>
      )}

      <Tabs.Panel value="filter_ticket" pt="xs">
        <TicketFormTabs
          initialData={initialData}
          onClose={onClose}
          onSubmit={(filters) => onSubmitTicket(filters, "ticket")}
          loading={loading}
        />
      </Tabs.Panel>

      <Tabs.Panel value="filter_message" pt="xs">
        <Flex direction="column" gap="md">
          <TextInput
            label={getLanguageByKey("searchByMessages")}
            placeholder={getLanguageByKey("searchByMessages")}
            value={message}
            onChange={(e) => setMessage(e.currentTarget.value)}
          />

          <Select
            label={getLanguageByKey("typeMessages")}
            placeholder={getLanguageByKey("typeMessages")}
            data={MESSAGES_TYPE_OPTIONS}
            value={mtype}
            onChange={setMtype}
            clearable
          />

          <DatePickerInput
            type="range"
            label={getLanguageByKey("searchByInterval")}
            placeholder={getLanguageByKey("searchByInterval")}
            value={timeSent}
            onChange={setTimeSent}
            valueFormat="DD-MM-YYYY"
            clearable
          />

          <MultiSelect
            label={getLanguageByKey("Selectează operator")}
            placeholder={getLanguageByKey("Selectează operator")}
            data={technicians}
            value={senderIds}
            onChange={setSenderIds}
            searchable
            clearable
          />
          <Flex justify="end" gap="md" mt="md">
            <Button variant="outline" onClick={handleResetMessageFilter}>
              {getLanguageByKey("Reset filter")}
            </Button>
            <Button variant="default" onClick={onClose}>
              {getLanguageByKey("Închide")}
            </Button>
            <Button variant="filled" loading={loading} onClick={handleApplyMessageFilter}>
              {getLanguageByKey("Aplică")}
            </Button>
          </Flex>
          
        </Flex>
      </Tabs.Panel>
    </Tabs>
  );
};
