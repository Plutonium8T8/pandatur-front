import { GoArchive } from "react-icons/go";
import { Flex, Text, DEFAULT_THEME } from "@mantine/core";
import { getLanguageByKey } from "./utils";

export const Empty = () => {
  return (
    <Flex
      justify="center"
      align="center"
      direction="column"
      h="100%"
      c={DEFAULT_THEME.colors.dark[2]}
    >
      <div className="mb-16">
        <GoArchive size={64} />
      </div>

      <Text>{getLanguageByKey("Fără date media")}</Text>
    </Flex>
  );
};
