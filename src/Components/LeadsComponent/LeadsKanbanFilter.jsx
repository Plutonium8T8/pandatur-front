import { Tabs, Button, Flex } from "@mantine/core";
import { getLanguageByKey } from "../utils";
import { TicketFormTabs } from "../TicketFormTabs";
import { MessageFilterForm } from "./MessageFilterForm";
import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

export const LeadsKanbanFilter = ({
  onClose,
  loading,
  initialData,
  fetchKanbanTickets,
  setKanbanFilterActive,
  setKanbanFilters,
  setKanbanTickets,
  onWorkflowSelected,
  groupTitleForApi,
  kanbanSearchTerm,
  fetchTickets
}) => {
  const [activeTab, setActiveTab] = useState("filter_ticket");
  const [searchParams, setSearchParams] = useSearchParams();

  const ticketFormRef = useRef();
  const messageFormRef = useRef();

  const isEmpty = (v) =>
    v === undefined ||
    v === null ||
    v === "" ||
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === "object" && Object.keys(v).length === 0);

  const mergeFilters = (...filters) =>
    Object.fromEntries(
      Object.entries(Object.assign({}, ...filters)).filter(
        ([_, v]) => !isEmpty(v)
      )
    );

  const handleReset = () => {
    setKanbanFilters({});
    setKanbanFilterActive(false);
    setKanbanTickets([]);
    setSearchParams({ view: "kanban" }, { replace: true });
    fetchTickets();
    onClose?.();
  };

  const handleSubmit = () => {
    const ticketValues = ticketFormRef.current?.getValues?.() || {};
    const messageValues = messageFormRef.current?.getValues?.() || {};

    const combinedFilters = mergeFilters(
      ticketValues,
      messageValues,
      groupTitleForApi ? { group_title: groupTitleForApi } : {},
      kanbanSearchTerm?.trim() ? { search: kanbanSearchTerm.trim() } : {}
    );

    if (Object.keys(combinedFilters).length === 0) {
      handleReset();
      return;
    }

    const newParams = new URLSearchParams();
    Object.entries(combinedFilters).forEach(([key, value]) => {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        ("from" in value || "to" in value)
      ) {
        if (value.from) newParams.set(`${key}_from`, value.from);
        if (value.to) newParams.set(`${key}_to`, value.to);
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((v) => newParams.append(key, v));
        return;
      }

      newParams.set(key, value);
    });
    newParams.set("view", "kanban");
    newParams.set("type", "light");
    setSearchParams(newParams, { replace: true });

    setKanbanFilterActive(true);
    setKanbanFilters(combinedFilters);
    fetchKanbanTickets(combinedFilters);
    onWorkflowSelected?.(ticketValues.workflow || []);
    onClose?.();
  };

  return (
    <Tabs
      h="100%"
      className="leads-modal-filter-tabs"
      defaultValue="filter_ticket"
      value={activeTab}
      onChange={setActiveTab}
      pb="48px"
    >
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
          ref={ticketFormRef}
          initialData={initialData}
          loading={loading}
        />
      </Tabs.Panel>

      <Tabs.Panel value="filter_message" pt="xs">
        <MessageFilterForm
          ref={messageFormRef}
          initialData={initialData}
          loading={loading}
        />
      </Tabs.Panel>

      <Flex justify="end" gap="md" mt="md" pr="md">
        <Button variant="outline" onClick={handleReset}>
          {getLanguageByKey("Reset filter")}
        </Button>
        <Button variant="default" onClick={onClose}>
          {getLanguageByKey("Închide")}
        </Button>
        <Button variant="filled" loading={loading} onClick={handleSubmit}>
          {getLanguageByKey("Aplică")}
        </Button>
      </Flex>
    </Tabs>
  );
};
