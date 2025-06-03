import { useState, useEffect, useRef, useMemo } from "react";
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
  Modal
} from "@mantine/core";
import { getLanguageByKey } from "../utils";
import { useUser, useApp, useDOMElementHeight } from "../../hooks";
import { ChatListItem } from "./components";
import { TicketFormTabs } from "../TicketFormTabs";
import { MessageFilterForm } from "../LeadsComponent/MessageFilterForm";
import { useDebouncedValue } from "@mantine/hooks";

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

const ChatList = ({ selectTicketId }) => {
  const { tickets, chatFilteredTickets, fetchChatFilteredTickets, setChatFilteredTickets, chatSpinner } = useApp();
  const { userId } = useUser();

  const [showMyTickets, setShowMyTickets] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
  const [rawSearchQuery, setRawSearchQuery] = useState("");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, 300);
  const chatListRef = useRef(null);
  const wrapperChatItemRef = useRef(null);
  const wrapperChatHeight = useDOMElementHeight(wrapperChatItemRef);
  const [chatFilters, setChatFilters] = useState({});

  const visibleTickets = chatFilteredTickets.length > 0 ? chatFilteredTickets : tickets;

  const filterChatList = (filters) => {
    setChatFilters(filters);
    fetchChatFilteredTickets(filters);
    setOpenFilter(false);
  };

  useEffect(() => {
    if (chatListRef.current && selectTicketId) {
      const container = chatListRef.current;
      const selectedElement = container.querySelector(`[data-ticket-id="${selectTicketId}"]`);
      if (selectedElement) {
        const containerHeight = container.clientHeight;
        const itemTop = selectedElement.offsetTop;
        const itemHeight = selectedElement.clientHeight;
        const scrollTop = itemTop - containerHeight / 2 + itemHeight / 2;
        container.scrollTo({ top: scrollTop });
      }
    }
  }, [selectTicketId, visibleTickets]);

  const sortedTickets = useMemo(() => {
    let result = [...visibleTickets];
    result.sort((a, b) => getLastMessageTime(b) - getLastMessageTime(a));
    if (showMyTickets) {
      result = result.filter(ticket => ticket.technician_id === userId);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ticket => {
        const idMatch = ticket.id.toString().includes(query);
        const contactMatch = ticket.contact?.toLowerCase().includes(query);
        const tags = ticket.tags ? ticket.tags.replace(/[{}]/g, "").split(",").map(tag => tag.trim().toLowerCase()) : [];
        const tagMatch = tags.some(tag => tag.includes(query));
        const phones = ticket.clients?.map(c => (String(c.phone || "").toLowerCase())) || [];
        const phoneMatch = phones.some(phone => phone.includes(query));
        return idMatch || contactMatch || tagMatch || phoneMatch;
      });
    }
    return result;
  }, [visibleTickets, showMyTickets, searchQuery]);

  const ChatItem = ({ index, style }) => (
    <ChatListItem chat={sortedTickets[index]} style={style} selectTicketId={selectTicketId} />
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
          <FixedSizeList
            height={wrapperChatHeight}
            itemCount={sortedTickets.length}
            itemSize={CHAT_ITEM_HEIGHT}
            width="100%"
          >
            {ChatItem}
          </FixedSizeList>
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
            height: "800px",
            display: "flex",
            flexDirection: "column",
          },
          body: {
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
          },
        }}
      >
        <Tabs defaultValue="filter_ticket" className="leads-modal-filter-tabs" h="100%">
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
              orientation="horizontal"
              onClose={() => setOpenFilter(false)}
              onSubmit={filterChatList}
              loading={chatSpinner}
              initialData={chatFilters}
            />
          </Tabs.Panel>

          <Tabs.Panel value="filter_message" pt="xs">
            <MessageFilterForm
              onClose={() => setOpenFilter(false)}
              onSubmit={filterChatList}
              loading={chatSpinner}
              initialData={chatFilters}
            />
          </Tabs.Panel>
        </Tabs>
      </Modal>
    </>
  );
};

export default ChatList;
