import { Input, Flex, ActionIcon, Select } from "@mantine/core"
import { useState, useRef } from "react"
import { createPortal } from "react-dom"
import EmojiPicker from "emoji-picker-react"
import { FaPaperPlane, FaSmile } from "react-icons/fa"
import { FaFile } from "react-icons/fa6"
import { getLanguageByKey } from "../../../utils"
import { templateOptions } from "../../../../FormOptions"
import "./ChatInput.css"

export const ChatInput = ({
  id,
  inputValue,
  onChangeTextArea,
  onSendMessage,
  onHandleFileSelect,
  renderSelectUserPlatform,
  loading
}) => {
  const fileInputRef = useRef(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0
  })

  const handleSelectTemplateChange = (value) => {
    if (value) {
      setSelectedMessage(value)
      onChangeTextArea(templateOptions[value])
    } else {
      setSelectedMessage(null)
      onChangeTextArea("")
    }
  }

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

  return (
    <>
      <Flex gap="lg" align="center" mb="lg">
        <input
          type="file"
          accept="image/*,audio/mp3,video/mp4,application/pdf,audio/ogg"
          onChange={handleFile}
          ref={fileInputRef}
          style={{ display: "none" }}
        />
        <ActionIcon
          size="input-lg"
          onClick={handleFileButtonClick}
          variant="default"
        >
          <FaFile />
        </ActionIcon>

        <ActionIcon
          size="input-lg"
          onClick={handleEmojiClickButton}
          variant="default"
        >
          <FaSmile />
        </ActionIcon>
        <Input
          size="lg"
          w="100%"
          disabled={!id}
          value={inputValue}
          onChange={(e) => onChangeTextArea(e.target.value.trim())}
          placeholder={getLanguageByKey("Introduceți mesaj")}
        />
        <ActionIcon
          loading={loading}
          size="input-lg"
          onClick={onSendMessage}
          variant="default"
        >
          <FaPaperPlane />
        </ActionIcon>
      </Flex>

      <Flex gap="lg">
        <Select
          w="100%"
          clearable
          placeholder={getLanguageByKey("Introduceți mesaj")}
          onChange={handleSelectTemplateChange}
          value={selectedMessage ?? ""}
          data={Object.entries(templateOptions).map(([key, value]) => ({
            value: key,
            label: key
          }))}
        />

        {renderSelectUserPlatform()}
      </Flex>

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
                onChangeTextArea((prev) => prev + emoji.emoji)
              }
            />
          </div>,
          document.body
        )}
    </>
  )
}
