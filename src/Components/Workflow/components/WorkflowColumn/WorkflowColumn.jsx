import { getColorByWorkflowType, getBrightByWorkflowType } from "../WorkflowTag"
import TicketCard from "../../../LeadsComponent/TicketCardComponent"
import { getLanguageByKey } from "../../../utils"
import "./WorkflowColumn.css"

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
  const filteredTickets = filterTickets(workflow, tickets)

  return (
    <div
      className="colone-ticket"
      style={{
        backgroundColor: getColorByWorkflowType(workflow, "")
      }}
    >
      <div
        className="name-workflow"
        style={{
          backgroundColor: getBrightByWorkflowType(workflow, "")
        }}
      >
        {getLanguageByKey(workflow)}

        <div className="ticket-counter-display">
          <div className="ticket-counter ticket-counter-red">
            {
              filteredTickets.filter(
                (ticket) =>
                  ticket.creation_date === ticket.last_interaction_date
              ).length
            }
          </div>
          /
          <div className="ticket-counter ticket-counter-green">
            {filteredTickets.length}
          </div>
        </div>
      </div>
      <div className="scrollable-list">
        {filteredTickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onEditTicket={onEditTicket}
          />
        ))}
      </div>
    </div>
  )
}
