import { Flex, Text, Badge, DEFAULT_THEME } from "@mantine/core"
import { getBrightByWorkflowType } from "./WorkflowTag"
import { getLanguageByKey } from "../../utils"

const { colors } = DEFAULT_THEME

export const WorkflowColumnHeader = ({ workflow, filteredTickets }) => {
  return (
    <Flex
      p="8"
      pr="md"
      justify="space-between"
      align="center"
      style={{
        backgroundColor: getBrightByWorkflowType(workflow, ""),
        borderRadius: "50px"
      }}
    >
      <Badge bg="white" c="white" size="lg">
        <Flex gap="xs">
          <Text fw="bold" c="red">
            {
              filteredTickets.filter(
                (ticket) =>
                  ticket.creation_date === ticket.last_interaction_date
              ).length
            }
          </Text>

          <Text c={colors.dark[7]}>/</Text>

          <Text fw="bold" c="green">
            {filteredTickets.length}
          </Text>
        </Flex>
      </Badge>

      <Text c={colors.dark[7]} fw="bold">
        {getLanguageByKey(workflow)}
      </Text>
    </Flex>
  )
}
