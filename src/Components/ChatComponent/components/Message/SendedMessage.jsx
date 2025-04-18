import { Flex, Text } from "@mantine/core";
import { CiWarning } from "react-icons/ci";
import { IoMdCheckmark } from "react-icons/io";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import { renderContent } from "../../renderContent";
import { HH_mm } from "../../../../app-constants";
import { parseServerDate, MESSAGES_STATUS } from "../../../utils";
import "./Message.css";

const MESSAGE_STATUS_ICONS = {
  [MESSAGES_STATUS.PENDING]: <IoMdCheckmark />,
  [MESSAGES_STATUS.ERROR]: (
    <Flex c="red">
      <CiWarning />
    </Flex>
  ),

  [MESSAGES_STATUS.SUCCESS]: <IoCheckmarkDoneSharp />,
};

export const SendedMessage = ({ msg }) => {
  return (
    <Flex w="100%" justify="end">
      <Flex w="90%" direction="column" className="chat-message sent">
        <Flex justify="end" gap="8">
          <Flex>
            <Flex miw="250px" direction="column" p="8" className="text">
              {renderContent(msg)}

              <Flex justify="end" align="center" gap={4}>
                <Flex align="center">
                  {MESSAGE_STATUS_ICONS[msg.messageStatus]}
                </Flex>

                <Text size="sm">
                  {parseServerDate(msg.time_sent).format(HH_mm)}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};
