import {
  Input,
  Flex,
  ActionIcon,
  Select,
  Box,
  Divider,
  Menu,
  Tooltip
} from "@mantine/core"
import { useState, useRef } from "react"
import { createPortal } from "react-dom"
import EmojiPicker from "emoji-picker-react"
import { HiOutlineDotsVertical } from "react-icons/hi"
import { GoTasklist } from "react-icons/go"
import { FiSend } from "react-icons/fi"
import { MdOutlineEmojiEmotions } from "react-icons/md"
import { ImAttachment } from "react-icons/im"
import { getLanguageByKey } from "../../../utils"
import { templateOptions } from "../../../../FormOptions"
import "./ChatInput.css"

export const ChatInput = ({
  onSendMessage,
  onHandleFileSelect,
  renderSelectUserPlatform,
  onOpenTaskDrawer,
  loading,
  tasksCount
}) => {
  const [message, setMessage] = useState("")
  const fileInputRef = useRef(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0
  })

  const handleEmojiClickButton = (event) => {
    const rect = event.target.getBoundingClientRect()
    const emojiPickerHeight = 450

    setEmojiPickerPosition({
      top: rect.top + window.scrollY - emojiPickerHeight,
      left: rect.left + window.scrollX
    })

    setShowEmojiPicker((prev) => !prev)
  }

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFile = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    onHandleFileSelect(selectedFile)
  }

  const sendMessage = () => {
    if (message?.trim()) {
      onSendMessage(message)

      setMessage("")
      setSelectedMessage(null)
    }
  }

  return (
    <Box>
      <Divider />

      <Box py="16px" px="16px" className="chat-input-send-message">
        <Flex gap="lg" align="center" className="chat-input-send-message">
          <input
            type="file"
            accept="image/*,audio/mp3,video/mp4,application/pdf,audio/ogg"
            onChange={handleFile}
            ref={fileInputRef}
            style={{ display: "none" }}
          />
          <ActionIcon
            bg="white"
            c="black"
            variant="light"
            size="xs"
            className="pointer"
            onClick={handleFileButtonClick}
          >
            <ImAttachment />
          </ActionIcon>

          <ActionIcon
            bg="white"
            c="black"
            variant="light"
            size="xs"
            className="pointer"
            onClick={handleEmojiClickButton}
          >
            <MdOutlineEmojiEmotions />
          </ActionIcon>

          <Input
            size="md"
            w="100%"
            value={message}
            variant="filled"
            onChange={(e) => setMessage(e.target.value)}
            placeholder={getLanguageByKey("Introduceți mesaj")}
          />

          <ActionIcon
            onClick={sendMessage}
            bg={message?.trim() ? "" : "white"}
            c={message?.trim() ? "#0f824c" : "black"}
            variant="light"
            size={"md"}
          >
            <FiSend />
          </ActionIcon>

          <Divider orientation="vertical" />

          <Menu shadow="md">
            <Menu.Target>
              <Tooltip label={getLanguageByKey("more_options")}>
                <ActionIcon variant="default">
                  <HiOutlineDotsVertical />
                </ActionIcon>
              </Tooltip>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                onClick={onOpenTaskDrawer}
                leftSection={<GoTasklist size={14} />}
              >
                {`${getLanguageByKey("task")} (${tasksCount})`}
              </Menu.Item>
              <Menu.Item>Messages</Menu.Item>
              <Menu.Item>Gallery</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Flex>

        {/* <Flex gap="lg">
        <Select
          size="md"
          w="100%"
          clearable
          placeholder={getLanguageByKey("select_message_template")}
          onChange={(value) => {
            setMessage(value ? templateOptions[value] : "")
            setSelectedMessage(value)
          }}
          value={selectedMessage}
          data={Object.keys(templateOptions).map((key) => ({
            value: key,
            label: key
          }))}
        />

        {renderSelectUserPlatform()}
      </Flex> */}

        {showEmojiPicker &&
          createPortal(
            <div
              className="emoji-picker-popup"
              style={{
                position: "absolute",
                top: emojiPickerPosition.top,
                left: emojiPickerPosition.left,
                zIndex: 1000
              }}
              onMouseEnter={() => setShowEmojiPicker(true)}
              onMouseLeave={() => setShowEmojiPicker(false)}
            >
              <EmojiPicker
                onEmojiClick={(emoji) =>
                  setMessage((prev) => prev + emoji.emoji)
                }
              />
            </div>,
            document.body
          )}
      </Box>
    </Box>
  )
}
