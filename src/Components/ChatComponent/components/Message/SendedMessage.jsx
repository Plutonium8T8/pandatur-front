import { Flex, Text } from "@mantine/core";
import { renderContent } from "../../utils";
import { HH_mm } from "../../../../app-constants";
import { parseServerDate } from "../../../utils";
import "./Message.css";

export const SendedMessage = ({ msg }) => {
  return (
    <Flex w="100%" justify="end">
      <Flex w="90%" direction="column" className="chat-message sent">
        <Flex justify="end" gap="8">
          <Flex
            style={{ border: msg.isError ? "1px solid red" : "none" }}
            miw="250px"
            direction="column"
            p="8"
            className="text"
          >
            {renderContent(msg)}

            <Text size="sm" ta="end">
              {parseServerDate(msg.time_sent).format(HH_mm)}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};
