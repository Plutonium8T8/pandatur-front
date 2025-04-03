import { Flex, Text, DEFAULT_THEME } from "@mantine/core"
import { renderContent } from "../../utils"
import { HH_mm } from "../../../../app-constants"
import { parseServerDate, getFullName } from "../../../utils"
import "./Message.css"

const { colors } = DEFAULT_THEME

export const SendedMessage = ({ msg, personalInfo }) => {
  return (
    <Flex w="100%" justify="end">
      <Flex w="70%" direction="column" className="chat-message sent">
        <Flex justify="end" gap="8">
          <Flex direction="column" p="8" className="text">
            <Text c={colors.gray[7]} size="sm" fw="bold">
              {getFullName(personalInfo?.name, personalInfo?.surname) ||
                `#${msg.client_id}`}
            </Text>

            {renderContent(msg)}

            <Text size="sm" ta="end">
              {parseServerDate(msg.time_sent).format(HH_mm)}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
