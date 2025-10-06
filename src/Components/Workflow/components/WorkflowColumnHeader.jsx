import { Flex, Text, Box, DEFAULT_THEME } from "@mantine/core";
import { getBrightByWorkflowType } from "./WorkflowTag";
import { getLanguageByKey } from "../../utils";

const { colors } = DEFAULT_THEME;

export const WorkflowColumnHeader = ({ workflow, filteredTickets }) => {
  return (
    <Box
      pos="relative"
      w="100%"
      h="60px"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Цветная линия внизу */}
      <Box
        pos="absolute"
        bottom={0}
        left={0}
        right={0}
        h="4px"
        style={{
          backgroundColor: getBrightByWorkflowType(workflow, ""),
          borderRadius: "2px",
        }}
      />
      
      {/* Контент поверх линии */}
      <Flex
        direction="column"
        align="center"
        gap="4px"
        style={{
          zIndex: 1,
          position: "relative",
        }}
      >
        <Text 
          fw="bold" 
          c={colors.dark[7]}
          size="sm"
          ta="center"
        >
          {getLanguageByKey(workflow)}
        </Text>
        
        <Text 
          fw="bold" 
          c={colors.dark[5]}
          size="xs"
          ta="center"
        >
          {filteredTickets.length} leads
        </Text>
      </Flex>
    </Box>
  );
};
