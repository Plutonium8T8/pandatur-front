import { useState, useEffect } from "react";
import { Tabs, Flex, Button, MultiSelect, TextInput, Select } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useGetTechniciansList } from "../../hooks";
import { getLanguageByKey } from "../utils";
import { TicketFormTabs } from "../TicketFormTabs";
import { MESSAGES_TYPE_OPTIONS } from "../../app-constants";
import { useDebounce } from "../../hooks";

export const LeadsTableFilter = ({
  onClose,
  loading,
  initialData,
  onSubmitTicket,
  messageFilters,
  setMessageFilters,
  handleApplyFiltersMessageTicket,
}) => {
  const { technicians, loading: loadingTechnicians } = useGetTechniciansList();
  const [messageInput, setMessageInput] = useState(messageFilters.message || "");
  const debouncedMessage = useDebounce(messageInput, 300);

  useEffect(() => {
    setMessageFilters((prev) => ({ ...prev, message: debouncedMessage }));
  }, [debouncedMessage]);

  return (
    <Tabs h="100%" className="leads-modal-filter-tabs" defaultValue="filter_ticket">
      <Tabs.List>
        <Tabs.Tab value="filter_ticket">
          {getLanguageByKey("Filtru pentru Lead")}
        </Tabs.Tab>
        <Tabs.Tab value="filter_message">
          {getLanguageByKey("Filtru dupǎ mesaje")}
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="filter_ticket" pt="xs">
        <TicketFormTabs
          initialData={initialData}
          onClose={onClose}
          onSubmit={onSubmitTicket}
          loading={loading}
        />
      </Tabs.Panel>

      <Tabs.Panel value="filter_message" pt="xs">
        <Flex direction="column" gap={20} h="100%">
          <TextInput
            label={getLanguageByKey("searchByMessages")}
            placeholder={getLanguageByKey("searchByMessages")}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
          />

          <DatePickerInput
            type="range"
            label={getLanguageByKey("searchByInterval")}
            placeholder={getLanguageByKey("searchByInterval")}
            value={messageFilters.time_sent ?? [null, null]}
            onChange={(value) =>
              setMessageFilters((prev) => ({ ...prev, time_sent: value }))
            }
            clearable
            valueFormat="DD-MM-YYYY"
          />

          <MultiSelect
            searchable
            clearable
            label={getLanguageByKey("Selectează operator")}
            placeholder={getLanguageByKey("Selectează operator")}
            data={technicians}
            value={messageFilters.sender_id}
            onChange={(value) =>
              setMessageFilters((prev) => ({ ...prev, sender_id: value }))
            }
            disabled={loadingTechnicians}
          />

          <Select
            searchable
            clearable
            label={getLanguageByKey("typeMessages")}
            placeholder={getLanguageByKey("typeMessages")}
            data={MESSAGES_TYPE_OPTIONS}
            value={messageFilters.mtype ?? null}
            onChange={(value) =>
              setMessageFilters((prev) => ({ ...prev, mtype: value }))
            }
          />

          <Flex justify="end" gap="md" mt="md">
            <Button
              variant="outline"
              onClick={() => {
                setMessageInput("");
                setMessageFilters({
                  message: "",
                  time_sent: [null, null],
                  sender_id: [],
                  mtype: null,
                });
              }}
            >
              {getLanguageByKey("Reset filter")}
            </Button>

            <Button variant="default" onClick={onClose}>
              {getLanguageByKey("Închide")}
            </Button>

            <Button
              variant="filled"
              loading={loading}
              onClick={() => handleApplyFiltersMessageTicket(messageFilters)}
            >
              {getLanguageByKey("Aplică")}
            </Button>
          </Flex>
        </Flex>
      </Tabs.Panel>
    </Tabs>
  );
};
