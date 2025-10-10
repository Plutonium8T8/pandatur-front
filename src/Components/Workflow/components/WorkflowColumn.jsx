import { VariableSizeList } from "react-window";
import { Flex, DEFAULT_THEME, Box } from "@mantine/core";
import { useRef, useEffect, forwardRef } from "react";
import { useSnackbar } from "notistack";
import { TicketCard } from "./TicketCard";
import { useDOMElementHeight, useConfirmPopup } from "../../../hooks";
import { WorkflowColumnHeader } from "./WorkflowColumnHeader";
import { showServerError, getLanguageByKey } from "../../utils";
import { api } from "../../../api";

const { colors } = DEFAULT_THEME;

const DEFAULT_TICKET_CARD_HEIGHT = 190;
const SPACE_BETWEEN_CARDS = 12;

const priorityOrder = {
  joasă: 1,
  medie: 2,
  înaltă: 3,
  critică: 4,
};

const filterTickets = (workflow, tickets) => {
  const filteredTickets = tickets
    .filter((ticket) => ticket.workflow === workflow)
    .sort((a, b) => {
      const priorityDiff =
        (priorityOrder[b.priority] || 5) - (priorityOrder[a.priority] || 5);
      if (priorityDiff !== 0) return priorityDiff;

      const dateA = a.last_interaction_date
        ? Date.parse(a.last_interaction_date)
        : Number.POSITIVE_INFINITY;
      const dateB = b.last_interaction_date
        ? Date.parse(b.last_interaction_date)
        : Number.POSITIVE_INFINITY;

      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return -1;
      if (isNaN(dateB)) return 1;

      return dateB - dateA;
    });

  return filteredTickets;
};

const wrapperColumn = forwardRef(({ style, ...rest }, ref) => (
  <Box
    ref={ref}
    pos="relative"
    mt={SPACE_BETWEEN_CARDS + SPACE_BETWEEN_CARDS}
    style={style}
    {...rest}
  />
));

export const WorkflowColumn = ({
  onEditTicket,
  searchTerm,
  workflow,
  tickets,
  technicianList,
  fetchTickets,
}) => {
  const columnRef = useRef(null);
  const columnHeight = useDOMElementHeight(columnRef);
  const listRef = useRef(null);
  const rowHeights = useRef({});
  const { enqueueSnackbar } = useSnackbar();

  const deleteTicketById = useConfirmPopup({
    subTitle: getLanguageByKey("confirm_delete_lead"),
  });

  const filteredTickets = filterTickets(workflow, tickets);

  const CardItem = ({ index, style }) => {
    const rowRef = useRef(null);
    const ticket = filteredTickets[index];

    const technician = technicianList.find(
      ({ value }) => Number(value) === ticket.technician_id,
    );

    function setRowHeight(index, size) {
      listRef.current.resetAfterIndex(0);
      rowHeights.current = { ...rowHeights.current, [index]: size };
    }

    const handleDeleteLead = (id) => {
      deleteTicketById(async () => {
        try {
          await api.tickets.deleteById([id]);
          enqueueSnackbar(getLanguageByKey("lead_deleted_successfully"), {
            variant: "success",
          });
          await fetchTickets();
        } catch (error) {
          enqueueSnackbar(showServerError(error), {
            variant: "error",
          });
        }
      });
    };

    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(index, rowRef.current.clientHeight + SPACE_BETWEEN_CARDS);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rowRef]);

    return (
      <div style={style}>
        <div ref={rowRef}>
          <TicketCard
            ticket={ticket}
            onEditTicket={onEditTicket}
            technician={technician}
            onDeleteTicket={handleDeleteLead}
          />
        </div>
      </div>
    );
  };

  return (
    <Flex
      pos="relative"
      direction="column"
      bg="var(--crm-ui-kit-palette-background-primary)"
      style={{
        // borderRadius: 32,
        flex: "0 0 400px",
        color: "var(--crm-ui-kit-palette-text-primary)",
        // border: "1px solid var(--crm-ui-kit-palette-border-primary)",
      }}
    >
      <WorkflowColumnHeader
        workflow={workflow}
        filteredTickets={filteredTickets}
      />

      <Flex direction="column" h="100%" pb="120px" ref={columnRef}>
        <VariableSizeList
          ref={listRef}
          height={columnHeight}
          itemCount={filteredTickets.length}
          itemSize={(index) =>
            rowHeights.current[index] || DEFAULT_TICKET_CARD_HEIGHT
          }
          innerElementType={wrapperColumn}
        >
          {CardItem}
        </VariableSizeList>
      </Flex>
    </Flex>
  );
};
