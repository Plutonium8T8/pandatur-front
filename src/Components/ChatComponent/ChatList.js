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

// Hash map для быстрого поиска тикетов по различным критериям
const createSearchIndex = (tickets) => {
  const index = {
    byId: new Map(),
    byTechnicianId: new Map(),
    byClientName: new Map(),
    byClientPhone: new Map(),
    byTicketId: new Map()
  };

  tickets.forEach(ticket => {
    // Индекс по ID тикета
    index.byId.set(ticket.id, ticket);
    index.byTicketId.set(ticket.id.toString(), ticket);
    
    // Индекс по technician_id
    if (ticket.technician_id) {
      if (!index.byTechnicianId.has(ticket.technician_id)) {
        index.byTechnicianId.set(ticket.technician_id, []);
      }
      index.byTechnicianId.get(ticket.technician_id).push(ticket);
    }
    
    // Индексы по клиентам
    if (ticket.clients) {
      ticket.clients.forEach(client => {
        // По имени
        if (client.name) {
          const nameKey = client.name.toLowerCase();
          if (!index.byClientName.has(nameKey)) {
            index.byClientName.set(nameKey, []);
          }
          index.byClientName.get(nameKey).push(ticket);
        }
        
        // По фамилии
        if (client.surname) {
          const surnameKey = client.surname.toLowerCase();
          if (!index.byClientName.has(surnameKey)) {
            index.byClientName.set(surnameKey, []);
          }
          index.byClientName.get(surnameKey).push(ticket);
        }
        
        // По телефонам
        if (client.phones) {
          client.phones.forEach(phone => {
            if (phone) {
              const phoneKey = phone.toString().toLowerCase();
              if (!index.byClientPhone.has(phoneKey)) {
                index.byClientPhone.set(phoneKey, []);
              }
              index.byClientPhone.get(phoneKey).push(ticket);
            }
          });
        }
      });
    }
  });
  
  return index;
};

// Быстрый поиск с использованием hash map
const searchTickets = (index, query) => {
  if (!query) return [];
  
  const searchTerm = query.toLowerCase();
  const foundTickets = new Set();
  
  // Поиск по ID тикета
  if (index.byTicketId.has(searchTerm)) {
    foundTickets.add(index.byTicketId.get(searchTerm));
  }
  
  // Поиск по частичному совпадению ID
  for (const [ticketId, ticket] of index.byTicketId) {
    if (ticketId.includes(searchTerm)) {
      foundTickets.add(ticket);
    }
  }
  
  // Поиск по имени клиента
  for (const [name, tickets] of index.byClientName) {
    if (name.includes(searchTerm)) {
      tickets.forEach(ticket => foundTickets.add(ticket));
    }
  }
  
  // Поиск по телефону
  for (const [phone, tickets] of index.byClientPhone) {
    if (phone.includes(searchTerm)) {
      tickets.forEach(ticket => foundTickets.add(ticket));
    }
  }
  
  return Array.from(foundTickets);
};

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
  // приоритет: time_sent -> last_message_time
  const cand =
    ticket?.time_sent ??
    ticket?.last_message_time;
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

  // Создаем индекс для быстрого поиска
  const searchIndex = useMemo(() => {
    return createSearchIndex(baseTickets);
  }, [baseTickets]);

  const filteredTickets = useMemo(() => {
    let result = [...baseTickets];

    console.log("🔍 ChatList: Filtering tickets:", {
      totalTickets: baseTickets.length,
      ticketsWithActionNeeded: baseTickets.filter(t => Boolean(t.action_needed)).length,
      actionNeededTickets: baseTickets.filter(t => Boolean(t.action_needed)).map(t => ({
        id: t.id,
        action_needed: t.action_needed,
        unseen_count: t.unseen_count
      }))
    });

    // Показываем только тикеты с action_needed: true (они требуют внимания)
    result = result.filter(ticket => Boolean(ticket.action_needed));

    console.log("✅ ChatList: After action_needed filter:", {
      remainingTickets: result.length,
      ticketIds: result.map(t => t.id)
    });

    // Фильтр "Мои тикеты" - используем hash map для быстрого доступа
    if (showMyTickets) {
      const myTickets = searchIndex.byTechnicianId.get(userId) || [];
      result = result.filter(ticket => myTickets.includes(ticket));
    }

    // Поиск по запросу - используем оптимизированный поиск
    if (searchQuery) {
      const searchResults = searchTickets(searchIndex, searchQuery);
      result = result.filter(ticket => searchResults.includes(ticket));
    }

    return result;
  }, [baseTickets, showMyTickets, searchQuery, userId, searchIndex]);

  const sortedTickets = useMemo(() => {
    // Сортируем по времени последнего сообщения (по убыванию)
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
        <Flex direction="column" gap="xs" my="xs" pl="xs" pr="xs">
          <Flex align="center" justify="space-between">
            <Flex align="center" gap={8}>
              <Title order={3}>{getLanguageByKey("Chat")}</Title>
              <Badge
                variant="filled"
                style={{ backgroundColor: "var(--crm-ui-kit-palette-link-primary)" }}
              >
                {sortedTickets.length}
              </Badge>
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
            color="var(--crm-ui-kit-palette-link-primary)"
          />

          <TextInput
            placeholder={getLanguageByKey("Cauta dupa ID, Nume client, Telefon sau Email")}
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
        size="lg"
        styles={{
          content: {
            height: "700px",
            display: "flex",
            flexDirection: "column",
          },
          body: {
            flex: 1,
            overflowY: "auto",
            padding: "1rem"
          },
          title: {
            color: "var(--crm-ui-kit-palette-text-primary)"
          }
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
            <Button variant="outline" onClick={() => setOpenFilter(false)}>
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
