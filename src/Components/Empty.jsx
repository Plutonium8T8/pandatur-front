import { GoArchive } from "react-icons/go";
import { Flex, Text, DEFAULT_THEME } from "@mantine/core";
import { getLanguageByKey } from "./utils";

const renderContentEmpty = (
  <>
    <div className="mb-16">
      <GoArchive size={64} />
    </div>

    <Text>{getLanguageByKey("Fără date media")}</Text>
  </>
);

export const Empty = ({ renderEmptyContent }) => {
  return (
    <>
      {renderEmptyContent ? (
        renderEmptyContent(renderContentEmpty)
      ) : (
        <Flex
          justify="center"
          align="center"
          direction="column"
          c={DEFAULT_THEME.colors.dark[2]}
        >
          {renderContentEmpty}
        </Flex>
      )}
    </>
  );
};
