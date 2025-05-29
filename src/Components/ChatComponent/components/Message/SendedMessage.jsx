import { Flex, Text } from "@mantine/core";
import { CiWarning } from "react-icons/ci";
import { FaHeadphones } from "react-icons/fa6";
import { IoMdCheckmark } from "react-icons/io";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import { renderContent } from "../../renderContent";
import { HH_mm, MEDIA_TYPE } from "../../../../app-constants";
import { parseServerDate, MESSAGES_STATUS } from "../../../utils";
import { Call } from "./Call";
import "./Message.css";

const DEFAULT_SENDER_NAME = "Panda Tur";

const MESSAGE_STATUS_ICONS = {
  [MESSAGES_STATUS.PENDING]: <IoMdCheckmark />,
  [MESSAGES_STATUS.ERROR]: (
    <Flex c="red">
      <CiWarning />
    </Flex>
  ),
  [MESSAGES_STATUS.SUCCESS]: <IoCheckmarkDoneSharp />,
};

export const SendedMessage = ({ msg, technician }) => {
  const isCall = msg.mtype === MEDIA_TYPE.CALL;

  const senderName = technician?.label || DEFAULT_SENDER_NAME;

  return (
    <Flex w="100%" justify="end">
      {isCall ? (
        <Call
          time={msg.time_sent}
          from={msg.call_metadata?.src_num}
          to={msg.call_metadata?.dst_num}
          name={senderName}
          src={msg.message}
          status={msg.call_metadata?.status}
        />
      ) : (
        <Flex w="90%" direction="column" className="chat-message sent">
          <Flex justify="end" gap="8">
            <Flex>
              <Flex miw="250px" direction="column" p="8" className="text">
                <Flex align="center" gap={8}>
                  <FaHeadphones size={12} />
                  <Text fw="bold" size="sm">
                    {senderName}
                  </Text>
                </Flex>

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
      )}
    </Flex>
  );
};
