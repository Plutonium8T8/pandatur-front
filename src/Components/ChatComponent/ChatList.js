import React, { useState, useEffect, useRef, useMemo } from "react";
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
} from "@mantine/core";
import { useSnackbar } from "notistack";
import { getLanguageByKey, showServerError } from "../utils";
import { useUser, useApp, useDOMElementHeight } from "../../hooks";
import { ChatListItem } from "./components";
import { MantineModal } from "../MantineModal";
import { TicketFormTabs } from "../TicketFormTabs";
import { api } from "../../api";

const SORT_BY = "creation_date";
const ORDER = "DESC";
const LIGHT_TICKET = "light";

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
  const { tickets } = useApp();
  const { userId } = useUser();
  const [showMyTickets, setShowMyTickets] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [filteredTicketIds, setFilteredTicketIds] = useState(null);
  const [lightTicketFilters, setLightTicketFilters] = useState({});

  const chatListRef = useRef(null);
  const wrapperChatItemRef = useRef(null);
  const wrapperChatHeight = useDOMElementHeight(wrapperChatItemRef);

  const filterChatList = async (attributes) => {
    setIsLoading(true);
    try {
      const lightTickets = await api.tickets.filters({
        sort_by: SORT_BY,
        order: ORDER,
        type: LIGHT_TICKET,
        attributes,
      });

      setOpenFilter(false);
      setLightTicketFilters(attributes);
      setFilteredTicketIds(lightTickets.data.map(({ id }) => id));
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // FIXME: Need to center `active` chat on the Y axis
  useEffect(() => {
    if (chatListRef.current && selectTicketId) {
      const container = chatListRef.current;
      const selectedElement = container.querySelector(
        `[data-ticket-id="${selectTicketId}"]`,
      );

      if (selectedElement) {
        const containerHeight = container.clientHeight;
        const itemTop = selectedElement.offsetTop;
        const itemHeight = selectedElement.clientHeight;
        const scrollTop = itemTop - containerHeight / 2 + itemHeight / 2;

        container.scrollTo({
          top: scrollTop,
        });
      }
    }
  }, [selectTicketId, tickets]);

  // TODO: Please refactor me
  const sortedTickets = useMemo(() => {
    let filtered = [...tickets];

    filtered.sort((a, b) => getLastMessageTime(b) - getLastMessageTime(a));

    if (showMyTickets) {
      filtered = filtered.filter((ticket) => ticket.technician_id === userId);
    }

    if (searchQuery) {
      const lowerSearchQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((ticket) => {
        const ticketId = ticket.id.toString().toLowerCase();
        const ticketContact = ticket.contact
          ? ticket.contact.toLowerCase()
          : "";
        const tags = ticket.tags
          ? ticket.tags
              .replace(/[{}]/g, "")
              .split(",")
              .map((tag) => tag.trim().toLowerCase())
          : [];

        return (
          ticketId.includes(lowerSearchQuery) ||
          ticketContact.includes(lowerSearchQuery) ||
          tags.some((tag) => tag.includes(lowerSearchQuery))
        );
      });
    }

    if (filteredTicketIds === null) return filtered;
    if (filteredTicketIds.length === 0) return [];
    filtered = filtered.filter((ticket) =>
      filteredTicketIds.includes(ticket.id),
    );

    return filtered;
  }, [tickets, showMyTickets, searchQuery, filteredTicketIds]);

  const ChatItem = ({ index, style }) => {
    const ticket = sortedTickets[index];

    return (
      <ChatListItem
        chat={ticket}
        style={style}
        selectTicketId={selectTicketId}
      />
    );
  };

  return (
    <>
      <Box direction="column" w="20%" ref={chatListRef}>
        <Flex direction="column" gap="xs" my="xs" pl="24px" pr="16px">
          <Flex align="center" justify="space-between">
            <Flex align="center" gap={8}>
              <Title order={3}>{getLanguageByKey("Chat")}</Title>

              <Badge bg="#0f824c">{sortedTickets.length}</Badge>
            </Flex>

            <ActionIcon
              variant="default"
              size="24"
              onClick={() => setOpenFilter(true)}
            >
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
            onInput={(e) => setSearchQuery(e.target.value.trim().toLowerCase())}
          />
        </Flex>

        <Divider />
        <Box style={{ height: "calc(100% - 127px)" }} ref={wrapperChatItemRef}>
          <FixedSizeList
            height={wrapperChatHeight}
            itemCount={sortedTickets?.length || 0}
            itemSize={CHAT_ITEM_HEIGHT}
            width="100%"
          >
            {ChatItem}
          </FixedSizeList>
        </Box>
      </Box>

      <MantineModal
        title={getLanguageByKey("Filtrează tichete")}
        open={openFilter}
        onClose={() => setOpenFilter(false)}
      >
        <TicketFormTabs
          initialData={lightTicketFilters}
          orientation="horizontal"
          onClose={() => setOpenFilter(false)}
          onSubmit={(filters) => filterChatList(filters)}
          loading={isLoading}
        />
      </MantineModal>
    </>
  );
};

export default ChatList;
