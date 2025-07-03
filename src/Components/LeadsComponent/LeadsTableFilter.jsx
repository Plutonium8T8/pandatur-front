import { Tabs, Flex, Button } from "@mantine/core";
import { getLanguageByKey } from "../utils";
import { TicketFormTabs } from "../TicketFormTabs";
import { MessageFilterForm } from "./MessageFilterForm";
import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

export const LeadsTableFilter = ({
  onClose,
  loading,
  initialData,
  onSubmitTicket,
  onResetFilters,
  groupTitleForApi,
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

  const handleSubmit = () => {
    const ticketValues = ticketFormRef.current?.getValues?.() || {};
    const messageValues = messageFormRef.current?.getValues?.() || {};

    const combinedFilters = mergeFilters(
      ticketValues,
      messageValues,
      groupTitleForApi ? { group_title: groupTitleForApi } : {}
    );

    const newParams = new URLSearchParams();
    Object.entries(combinedFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => newParams.append(key, v));
      } else {
        newParams.set(key, value);
      }
    });
    newParams.set("view", "list");
    newParams.set("type", "hard");
    setSearchParams(newParams, { replace: true });

    // Больше ничего здесь не вызываем! Всё, фильтр ушёл в url, родитель сам обработает по useEffect
    onClose?.();
  };

  const handleReset = () => {
    setSearchParams({ view: "list", type: "hard" }, { replace: true });
    onResetFilters?.();
    onClose?.();
  };

  return (
    <Tabs
      h="100%"
      className="leads-modal-filter-tabs"
      defaultValue="filter_ticket"
      value={activeTab}
      onChange={setActiveTab}
      pb="48"
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
        <Flex direction="column" justify="space-between" h="100%">
          <TicketFormTabs
            ref={ticketFormRef}
            initialData={initialData}
            loading={loading}
          />
        </Flex>
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
