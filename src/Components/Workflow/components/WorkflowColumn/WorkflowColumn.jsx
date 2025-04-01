import { FixedSizeList } from "react-window"
import { Flex, DEFAULT_THEME } from "@mantine/core"
import { useRef } from "react"
import { TicketCard } from "../TicketCard"
import { useDOMElementHeight } from "../../../../hooks"
import { WorkflowColumnHeader } from "../WorkflowColumnHeader"
import "./WorkflowColumn.css"

const { colors } = DEFAULT_THEME

const TICKET_CARD_HEIGHT = 190

const priorityOrder = {
  joasă: 1,
  medie: 2,
  înaltă: 3,
  critică: 4
}
const filterTickets = (workflow, tickets) => {
  const filteredTickets = tickets
    .filter((ticket) => ticket.workflow === workflow)
    .sort((a, b) => {
      const priorityDiff =
        (priorityOrder[b.priority] || 5) - (priorityOrder[a.priority] || 5)
      if (priorityDiff !== 0) return priorityDiff

      const dateA = a.last_interaction_date
        ? Date.parse(a.last_interaction_date)
        : Number.POSITIVE_INFINITY
      const dateB = b.last_interaction_date
        ? Date.parse(b.last_interaction_date)
        : Number.POSITIVE_INFINITY

      if (isNaN(dateA) && isNaN(dateB)) return 0
      if (isNaN(dateA)) return -1
      if (isNaN(dateB)) return 1

      return dateB - dateA
    })

  return filteredTickets
}

export const WorkflowColumn = ({
  onEditTicket,
  searchTerm,
  workflow,
  tickets
}) => {
  const columnRef = useRef(null)
  const columnHeight = useDOMElementHeight(columnRef)

  const filteredTickets = filterTickets(workflow, tickets)

  return (
    <Flex
      direction="column"
      bg={colors.gray[1]}
      className="colone-ticket"
      style={{
        borderRadius: 32
      }}
    >
      <WorkflowColumnHeader
        workflow={workflow}
        filteredTickets={filteredTickets}
      />

      <Flex direction="column" h="100%" ref={columnRef}>
        <FixedSizeList
          height={columnHeight}
          itemCount={filteredTickets.length}
          itemSize={TICKET_CARD_HEIGHT}
        >
          {({ index, style }) => (
            <div style={style}>
              <TicketCard
                key={filteredTickets[index].id}
                ticket={filteredTickets[index]}
                onEditTicket={onEditTicket}
              />
            </div>
          )}
        </FixedSizeList>
      </Flex>
    </Flex>
  )
}
