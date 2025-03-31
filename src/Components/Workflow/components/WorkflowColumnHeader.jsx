import { Flex, Text, Badge, DEFAULT_THEME } from "@mantine/core"
import { getBrightByWorkflowType } from "./WorkflowTag"
import { getLanguageByKey } from "../../utils"

const { colors } = DEFAULT_THEME

export const WorkflowColumnHeader = ({ workflow, filteredTickets }) => {
  return (
    <Flex
      p="8"
      justify="space-between"
      mb="md"
      align="center"
      style={{
        backgroundColor: getBrightByWorkflowType(workflow, ""),
        borderRadius: "100px"
      }}
    >
      <Text c={colors.dark[7]} fw="bold">
        {getLanguageByKey(workflow)}
      </Text>

      <Flex gap="xs">
        <Badge size="lg" color="red">
          {
            filteredTickets.filter(
              (ticket) => ticket.creation_date === ticket.last_interaction_date
            ).length
          }
        </Badge>

        <Badge color="green" size="lg">
          {filteredTickets.length}
        </Badge>
      </Flex>
    </Flex>
  )
}
