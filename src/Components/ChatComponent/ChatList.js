import React, { useState, useEffect, useRef, useMemo } from "react";
import { FixedSizeList } from "react-window";
import { LuFilter } from "react-icons/lu";
import {
  TextInput,
  Title,
  Flex,
  Box,
  Divider,
  ActionIcon,
  Badge,
  Tabs,
  Checkbox,
} from "@mantine/core";
import { useSnackbar } from "notistack";
import { getLanguageByKey, showServerError } from "../utils";
import { useUser, useApp, useDOMElementHeight } from "../../hooks";
import { ChatListItem } from "./components";
import { MantineModal } from "../MantineModal";
import { TicketFormTabs } from "../TicketFormTabs";
import { api } from "../../api";
import { MessageFilterForm } from "../LeadsComponent/MessageFilterForm";
import { convertRolesToMatrix, safeParseJson } from "../UsersComponent/rolesUtils";
import { useSameTeamChecker } from "../utils/useSameTeamChecker";

const SORT_BY = "creation_date";
const ORDER = "DESC";
const LIGHT_TICKET = "light";
const CHAT_ITEM_HEIGHT = 94;

const parseCustomDate = (dateStr) => {
  if (!dateStr) return 0;
  const [datePart, timePart] = dateStr.split(" ");
  const [day, month, year] = datePart.split("-").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
};

const getLastMessageTime = (ticket) => parseCustomDate(ticket.time_sent);

const ChatList = ({ selectTicketId }) => {
  const { tickets } = useApp();
  const { userId, user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredTicketIds, setFilteredTicketIds] = useState(null);
  const [lightTicketFilters, setLightTicketFilters] = useState({});
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const chatListRef = useRef(null);
  const wrapperChatItemRef = useRef(null);
  const wrapperChatHeight = useDOMElementHeight(wrapperChatItemRef);

  const matrix = useMemo(() => convertRolesToMatrix(safeParseJson(user?.roles || [])), [user]);
  const currentUserId = String(userId);
  const isSameTeam = useSameTeamChecker();

  const level = matrix?.["CHAT_VIEW"];

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

  useEffect(() => {
    if (chatListRef.current && selectTicketId) {
      const container = chatListRef.current;
      const selectedElement = container.querySelector(`[data-ticket-id="${selectTicketId}"]`);
      if (selectedElement) {
        const scrollTop =
          selectedElement.offsetTop - container.clientHeight / 2 + selectedElement.clientHeight / 2;
        container.scrollTo({ top: scrollTop });
      }
    }
  }, [selectTicketId, tickets]);

  const sortedTickets = useMemo(() => {
    if (!tickets?.length) return [];

    let result = [...tickets];

    if (level === "Denied") return [];
    if (level === "IfResponsible") {
      result = result.filter(ticket => String(ticket.technician_id) === currentUserId);
    } else if (level === "Team") {
      result = result.filter(ticket => {
        const techId = String(ticket.technician_id);
        return techId === currentUserId || isSameTeam(techId);
      });
    }

    if (showOnlyMine) {
      result = result.filter(ticket => String(ticket.technician_id) === currentUserId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ticket => {
        const idMatch = ticket.id.toString().includes(query);
        const contactMatch = ticket.contact?.toLowerCase().includes(query);
        const tags = ticket.tags
          ? ticket.tags.replace(/[{}]/g, "").split(",").map(tag => tag.trim().toLowerCase())
          : [];
        const tagMatch = tags.some(tag => tag.includes(query));
        const phones = ticket.clients?.map(c => c.phone?.toLowerCase() || "") || [];
        const phoneMatch = phones.some(phone => phone.includes(query));
        return idMatch || contactMatch || tagMatch || phoneMatch;
      });
    }

    if (filteredTicketIds !== null) {
      if (filteredTicketIds.length === 0) return [];
      result = result.filter(ticket => filteredTicketIds.includes(ticket.id));
    }

    return result.sort((a, b) => getLastMessageTime(b) - getLastMessageTime(a));
  }, [tickets, searchQuery, filteredTicketIds, level, currentUserId, isSameTeam, showOnlyMine]);

  const ChatItem = ({ index, style }) => {
    const ticket = sortedTickets[index];
    return <ChatListItem chat={ticket} style={style} selectTicketId={selectTicketId} />;
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
            <ActionIcon variant="default" size="24" onClick={() => setOpenFilter(true)}>
              <LuFilter size={12} />
            </ActionIcon>
          </Flex>

          <Checkbox
            label={getLanguageByKey("Leadurile mele")}
            checked={showOnlyMine}
            onChange={(e) => setShowOnlyMine(e.currentTarget.checked)}
            mt="xs"
          />

          <TextInput
            placeholder={getLanguageByKey("Cauta dupa Lead, Client sau Tag")}
            onInput={(e) => setSearchQuery(e.target.value.trim().toLowerCase())}
          />
        </Flex>

        <Divider />
        <Box style={{ height: "calc(100% - 147px)" }} ref={wrapperChatItemRef}>
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

      <MantineModal
        title={getLanguageByKey("Filtrează tichete")}
        open={openFilter}
        onClose={() => setOpenFilter(false)}
      >
        <Tabs defaultValue="filter_ticket" className="leads-modal-filter-tabs" h="100%">
          <Tabs.List>
            <Tabs.Tab value="filter_ticket">{getLanguageByKey("Filtru pentru Lead")}</Tabs.Tab>
            <Tabs.Tab value="filter_message">{getLanguageByKey("Filtru dupǎ mesaje")}</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="filter_ticket" pt="xs">
            <TicketFormTabs
              initialData={lightTicketFilters}
              orientation="horizontal"
              onClose={() => setOpenFilter(false)}
              onSubmit={(filters) => filterChatList(filters)}
              loading={isLoading}
            />
          </Tabs.Panel>

          <Tabs.Panel value="filter_message" pt="xs">
            <MessageFilterForm
              initialData={lightTicketFilters}
              loading={isLoading}
              onClose={() => setOpenFilter(false)}
              onSubmit={(filters) => filterChatList(filters)}
            />
          </Tabs.Panel>
        </Tabs>
      </MantineModal>
    </>
  );
};

export default ChatList;
