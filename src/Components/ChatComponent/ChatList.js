import { useState, useRef, useMemo, useCallback } from "react";
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

// безопасно приводим любую дату к timestamp
const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  // поддержим "YYYY-MM-DD HH:mm:ss", ISO, и пр.
  const s = String(val).trim().replace(" ", "T").replace(/Z$/, "");
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const getLastMessageTime = (ticket) => {
  // приоритет: time_sent -> last_message_time -> updated_at -> created_at
  const cand =
    ticket?.time_sent ??
    ticket?.last_message_time ??
    ticket?.updated_at ??
    ticket?.created_at;
  const d = toDate(cand);
  return d ? d.getTime() : 0;
};

const ChatList = ({ ticketId }) => {
  const { tickets, chatFilteredTickets, fetchChatFilteredTickets, chatSpinner } = useApp();
  const { userId } = useUser();

  const [isFiltered, setIsFiltered] = useState(false);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
  const [rawSearchQuery, setRawSearchQuery] = useState("");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, 300);
  const [chatFilters, setChatFilters] = useState({});

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
        
        // Поиск по клиентам
        const clientMatches = ticket.clients?.some((client) => {
          const phoneMatch = client.phone?.toString().toLowerCase().includes(query);
          const clientIdMatch = client.id?.toString().includes(query);
          const nameMatch = client.name?.toLowerCase().includes(query);
          const surnameMatch = client.surname?.toLowerCase().includes(query);
          return phoneMatch || clientIdMatch || nameMatch || surnameMatch;
        }) || false;
        
        return idMatch || contactMatch || clientMatches;
      });
    }

    return result;
  }, [baseTickets, showMyTickets, searchQuery, userId]);

  const sortedTickets = useMemo(() => {
    // по убыванию последнего сообщения
    return [...filteredTickets].sort((a, b) => getLastMessageTime(b) - getLastMessageTime(a));
  }, [filteredTickets]);


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
      <Box direction="column" w="20%">
        <Flex direction="column" gap="xs" my="xs" pl="24px" pr="16px">
          <Flex align="center" justify="space-between">
            <Flex align="center" gap={8}>
              <Title order={3}>{getLanguageByKey("Chat")}</Title>
              <Badge bg="#0f824c">{sortedTickets.length}</Badge>
            </Flex>
            <ActionIcon
              variant={isFiltered ? "filled" : "default"}
              size="36"
              onClick={() => setOpenFilter(true)}
            >
              <LuFilter size={16} />
            </ActionIcon>
          </Flex>

          <Checkbox
            label={getLanguageByKey("Leadurile mele")}
            onChange={(e) => setShowMyTickets(e.target.checked)}
            checked={showMyTickets}
          />

          <TextInput
            placeholder={getLanguageByKey("Cauta dupa Lead, Client, Telefon sau ID")}
            onInput={(e) => setRawSearchQuery(e.target.value)}
          />
        </Flex>

        <Divider color="var(--crm-ui-kit-palette-border-default)" />

        <Box style={{ height: "calc(100% - 127px)", position: "relative" }} ref={wrapperChatItemRef}>
          {sortedTickets.length === 0 ? (
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

          {chatSpinner && (
            <Box style={{ position: "absolute", bottom: 10, right: 10 }}>
              <Loader size="xl" color="green" />
            </Box>
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
