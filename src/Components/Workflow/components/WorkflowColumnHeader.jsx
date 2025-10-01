import { Flex, Text, Badge, DEFAULT_THEME } from "@mantine/core";
import { getBrightByWorkflowType } from "./WorkflowTag";
import { getLanguageByKey } from "../../utils";

const { colors } = DEFAULT_THEME;

export const WorkflowColumnHeader = ({ workflow, filteredTickets }) => {
  return (
    <Flex
      pos="absolute"
      top={0}
      left={0}
      right={0}
      w="100%"
      p="8"
      pr="16"
      justify="space-between"
      align="center"
      style={{
        backgroundColor: getBrightByWorkflowType(workflow, ""),
        borderRadius: "50px",
        zIndex: 1,
      }}
    >
      <Badge bg="white" c="white" size="lg">
        <Flex gap="xs">

          <Text fw="bold" c="green">
            {filteredTickets.length}
          </Text>
        </Flex>
      </Badge>

      <Text c={colors.dark[7]} fw="bold">
        {getLanguageByKey(workflow)}
      </Text>
    </Flex>
  );
};
