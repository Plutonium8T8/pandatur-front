import { Textarea, Flex, ActionIcon, Select, Box } from "@mantine/core";
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import EmojiPicker from "emoji-picker-react";
import { FaPaperPlane, FaSmile } from "react-icons/fa";
import { FaFile } from "react-icons/fa6";
import { getLanguageByKey } from "../../../utils";
import { templateOptions } from "../../../../FormOptions";
import "./ChatInput.css";

export const ChatInput = ({
  onSendMessage,
  onHandleFileSelect,
<<<<<<< HEAD
  renderSelectUserPlatform,
  loading,
=======
  clientList,
  onChangeClient,
  currentClient,
>>>>>>> e9d8a85 (refactor: optimistic update for chat messages)
}) => {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0,
  });

  const handleEmojiClickButton = (event) => {
    const rect = event.target.getBoundingClientRect();
    const emojiPickerHeight = 450;

    setEmojiPickerPosition({
      top: rect.top + window.scrollY - emojiPickerHeight,
      left: rect.left + window.scrollX,
    });

    setShowEmojiPicker((prev) => !prev);
  };

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFile = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    onHandleFileSelect(selectedFile);
  };

  const sendMessage = () => {
    if (message?.trim()) {
      onSendMessage(message);

      setMessage("");
      setSelectedMessage(null);
    }
  };

  return (
    <>
      <Flex gap="xs" p="16px">
        <Textarea
          autosize
          minRows={6}
          maxRows={8}
          w="100%"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={getLanguageByKey("Introduceți mesaj")}
        />

<<<<<<< HEAD
        <Box>
          <Flex justify="space-between" mb="10px">
            <ActionIcon
              loading={loading}
              size="input-md"
              onClick={sendMessage}
              variant="default"
            >
              <FaPaperPlane />
            </ActionIcon>
=======
        <Flex align="center" justify="space-between">
          <Flex gap="xs">
            <Button disabled={!message} variant="filled" onClick={sendMessage}>
              {getLanguageByKey("Trimite")}
            </Button>

            <Button onClick={clearState} variant="default">
              {getLanguageByKey("Anulează")}
            </Button>
          </Flex>
          <Flex>
>>>>>>> e9d8a85 (refactor: optimistic update for chat messages)
            <input
              type="file"
              accept="image/*,audio/mp3,video/mp4,application/pdf,audio/ogg"
              onChange={handleFile}
              ref={fileInputRef}
              style={{ display: "none" }}
            />
            <ActionIcon
              size="input-md"
              onClick={handleFileButtonClick}
              variant="default"
            >
              <FaFile />
            </ActionIcon>

            <ActionIcon
              size="input-md"
              onClick={handleEmojiClickButton}
              variant="default"
            >
              <FaSmile />
            </ActionIcon>
          </Flex>

          <Box>
            <Select
              mb="10px"
              size="md"
              w="100%"
              clearable
              placeholder={getLanguageByKey("select_message_template")}
              onChange={(value) => {
                setMessage(value ? templateOptions[value] : "");
                setSelectedMessage(value);
              }}
              value={selectedMessage}
              data={Object.keys(templateOptions).map((key) => ({
                value: key,
                label: key,
              }))}
            />

            {renderSelectUserPlatform()}
          </Box>
        </Box>
      </Flex>

      {showEmojiPicker &&
        createPortal(
          <div
            className="emoji-picker-popup"
            style={{
              position: "absolute",
              top: emojiPickerPosition.top,
              left: emojiPickerPosition.left,
              zIndex: 1000,
            }}
            onMouseEnter={() => setShowEmojiPicker(true)}
            onMouseLeave={() => setShowEmojiPicker(false)}
          >
            <EmojiPicker
              onEmojiClick={(emoji) => setMessage((prev) => prev + emoji.emoji)}
            />
          </div>,
          document.body,
        )}
    </>
  );
};
