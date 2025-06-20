import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { FixedSizeList } from "react-window";
import { LuFilter } from "react-icons/lu";
import {
  TextInput,
  Checkbox,
  Title,
  Flex,
  Box,
  Divider,
  ActionIcon,
  Badge,
  Tabs,
  Modal,
  Text,
  Button,
  Loader
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";

import { getLanguageByKey } from "../utils";
import { useUser, useApp, useDOMElementHeight } from "../../hooks";
import { ChatListItem } from "./components";
import { TicketFormTabs } from "../TicketFormTabs";
import { MessageFilterForm } from "../LeadsComponent/MessageFilterForm";

const CHAT_ITEM_HEIGHT = 94;

const parseCustomDate = (dateStr) => {
  if (!dateStr) return 0;
  const [datePart, timePart] = dateStr.split(" ");
  if (!datePart || !timePart) return 0;
  const [day, month, year] = datePart.split("-").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
};

const getLastMessageTime = (ticket) => parseCustomDate(ticket.time_sent);

const ChatList = ({ ticketId }) => {
  const { tickets, chatFilteredTickets, fetchChatFilteredTickets, chatSpinner } = useApp();
  const { userId } = useUser();

  const [isFiltered, setIsFiltered] = useState(false);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
  const [rawSearchQuery, setRawSearchQuery] = useState("");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, 300);
  const [chatFilters, setChatFilters] = useState({});

  const chatListRef = useRef(null);
  const wrapperChatItemRef = useRef(null);
  const wrapperChatHeight = useDOMElementHeight(wrapperChatItemRef);
  const [activeTab, setActiveTab] = useState("filter_ticket");
  const ticketFormRef = useRef();
  const messageFormRef = useRef();

  const baseTickets = useMemo(() => {
    return isFiltered ? chatFilteredTickets : tickets;
  }, [isFiltered, chatFilteredTickets, tickets]);

  const filteredTickets = useMemo(() => {
    let result = [...baseTickets];

    if (showMyTickets) {
      result = result.filter((t) => t.technician_id === userId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((ticket) => {
        const idMatch = ticket.id.toString().includes(query);
        const contactMatch = ticket.contact?.toLowerCase().includes(query);
        const tags = ticket.tags
          ? ticket.tags.replace(/[{}]/g, "").split(",").map((tag) => tag.trim().toLowerCase())
          : [];
        const tagMatch = tags.some((tag) => tag.includes(query));
        const phones = ticket.clients?.map((c) => String(c.phone || "").toLowerCase()) || [];
        const phoneMatch = phones.some((phone) => phone.includes(query));
        return idMatch || contactMatch || tagMatch || phoneMatch;
      });
    }

    return result;
  }, [baseTickets, showMyTickets, searchQuery, userId]);

  const sortedTickets = useMemo(() => {
    return [...filteredTickets].sort(
      (a, b) => getLastMessageTime(b) - getLastMessageTime(a)
    );
  }, [filteredTickets]);

  useEffect(() => {
    if (chatListRef.current && ticketId) {
      const element = chatListRef.current.querySelector(`[data-ticket-id="${ticketId}"]`);
      if (element) {
        element.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }, [ticketId]);

  const ChatItem = useCallback(
    ({ index, style }) => (
      <ChatListItem
        chat={sortedTickets[index]}
        style={style}
        selectTicketId={ticketId}
      />
    ),
    [sortedTickets, ticketId]
  );

  return (
    <>
      <Box direction="column" w="20%" ref={chatListRef}>
        <Flex direction="column" gap="xs" my="xs" pl="24px" pr="16px">
          <Flex align="center" justify="space-between">
            <Flex align="center" gap={8}>
              <Title order={3}>{getLanguageByKey("Chat")}</Title>
              <Badge bg="#0f824c">{sortedTickets.length}</Badge>
            </Flex>
            <ActionIcon variant="default" size="24" onClick={() => setOpenFilter(true)}>
              <LuFilter size={12} />
            </ActionIcon>
          </Flex>

          <Checkbox
            label={getLanguageByKey("Leadurile mele")}
            onChange={(e) => setShowMyTickets(e.target.checked)}
            checked={showMyTickets}
          />

          <TextInput
            placeholder={getLanguageByKey("Cauta dupa Lead, Client sau Tag")}
            onInput={(e) => setRawSearchQuery(e.target.value)}
          />
        </Flex>

        <Divider />

        <Box style={{ height: "calc(100% - 127px)" }} ref={wrapperChatItemRef}>
          {chatSpinner ? (
            <Flex h="100%" align="center" justify="center">
              <Loader size="sm" color="green" />
            </Flex>
          ) : sortedTickets.length === 0 ? (
            <Flex h="100%" align="center" justify="center" px="md">
              <Text c="dimmed">{getLanguageByKey("Nici un lead")}</Text>
            </Flex>
          ) : (
            <FixedSizeList
              height={wrapperChatHeight}
              itemCount={sortedTickets.length}
              itemSize={CHAT_ITEM_HEIGHT}
              width="100%"
            >
              {ChatItem}
            </FixedSizeList>
          )}
        </Box>
      </Box>

      <Modal
        opened={openFilter}
        onClose={() => setOpenFilter(false)}
        title={getLanguageByKey("Filtrează tichete")}
        withCloseButton
        centered
        size="xl"
        styles={{
          content: {
            height: "900px",
            display: "flex",
            flexDirection: "column",
          },
          body: {
            flex: 1,
            overflowY: "auto",
          },
        }}
      >
        <Tabs
          h="100%"
          className="leads-modal-filter-tabs"
          defaultValue="filter_ticket"
          value={activeTab}
          onChange={setActiveTab}
          pb="48"
        >
          <Tabs.List>
            <Tabs.Tab value="filter_ticket">{getLanguageByKey("Filtru pentru Lead")}</Tabs.Tab>
            <Tabs.Tab value="filter_message">{getLanguageByKey("Filtru dupǎ mesaje")}</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="filter_ticket" pt="xs">
            <TicketFormTabs
              ref={ticketFormRef}
              initialData={chatFilters}
              loading={chatSpinner}
            />
          </Tabs.Panel>

          <Tabs.Panel value="filter_message" pt="xs">
            <MessageFilterForm
              ref={messageFormRef}
              initialData={chatFilters}
              loading={chatSpinner}
            />
          </Tabs.Panel>

          <Flex justify="end" gap="md" mt="md" pr="md">
            <Button
              variant="outline"
              onClick={() => {
                setIsFiltered(false);
                setChatFilters({});
                setOpenFilter(false);
              }}
            >
              {getLanguageByKey("Reset filter")}
            </Button>
            <Button variant="default" onClick={() => setOpenFilter(false)}>
              {getLanguageByKey("Închide")}
            </Button>
            <Button
              variant="filled"
              loading={chatSpinner}
              onClick={() => {
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

                const ticketValues = ticketFormRef.current?.getValues?.() || {};
                const messageValues = messageFormRef.current?.getValues?.() || {};

                const combined = mergeFilters(ticketValues, messageValues);

                if (Object.keys(combined).length === 0) {
                  setIsFiltered(false);
                  setChatFilters({});
                } else {
                  fetchChatFilteredTickets(combined);
                  setChatFilters(combined);
                  setIsFiltered(true);
                }

                setOpenFilter(false);
              }}
            >
              {getLanguageByKey("Aplică")}
            </Button>
          </Flex>
        </Tabs>
      </Modal>
    </>
  );
};

export default ChatList;
