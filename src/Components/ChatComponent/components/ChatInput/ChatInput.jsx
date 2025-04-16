import {
  Textarea,
  Flex,
  ActionIcon,
  Box,
  Button,
  Select,
  Loader,
} from "@mantine/core";
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import EmojiPicker from "emoji-picker-react";
import { LuSmile } from "react-icons/lu";
import { RiAttachment2 } from "react-icons/ri";
import { getLanguageByKey, socialMediaIcons } from "../../../utils";
import { templateOptions } from "../../../../FormOptions";
import { useApp } from "../../../../hooks";
import "./ChatInput.css";

export const ChatInput = ({
  onSendMessage,
  onHandleFileSelect,
  clientList,
  onChangeClient,
  currentClient,
}) => {
  const { spinnerTickets, ticketError } = useApp();
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [template, setTemplate] = useState();
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
    fileInputRef.current?.click();
  };

  const handleFile = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    onHandleFileSelect(selectedFile);
  };

  const clearState = () => {
    setMessage("");
    setTemplate(null);
  };

  const sendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      clearState();
    }
  };

  return (
    <>
      <Box className="chat-input" p="16px">
        <Flex w="100%" gap="xs" mb="xs" align="center">
          {socialMediaIcons[currentClient.payload?.platform] && (
            <Flex>{socialMediaIcons[currentClient.payload?.platform]}</Flex>
          )}
          {spinnerTickets ? (
            <Loader size="xs" />
          ) : (
            <Select
              className="w-full"
              error={ticketError}
              onChange={(value) => {
                onChangeClient(value);
              }}
              placeholder={getLanguageByKey(
                ticketError ? "somethingWentWrong" : "selectUser",
              )}
              data={clientList.map((user) => ({
                value: user.value,
                label: user.label,
              }))}
            />
          )}

          <Select
            onChange={(value) => {
              setMessage(value ? templateOptions[value] : "");
              setTemplate(value);
            }}
            className="w-full"
            value={template}
            placeholder={getLanguageByKey("select_message_template")}
            data={Object.keys(templateOptions).map((key) => ({
              value: key,
              label: key,
            }))}
          />
        </Flex>
        <Textarea
          autosize
          minRows={6}
          maxRows={8}
          w="100%"
          mb="xs"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={getLanguageByKey("Introduceți mesaj")}
        />

        <Flex align="center" justify="space-between">
          <Flex gap="xs">
            <Button
              disabled={!message.trim() || !currentClient.payload}
              variant="filled"
              onClick={sendMessage}
            >
              {getLanguageByKey("Trimite")}
            </Button>

            <Button onClick={clearState} variant="default">
              {getLanguageByKey("Anulează")}
            </Button>
          </Flex>
          <Flex>
            <input
              type="file"
              accept="image/*,audio/mp3,video/mp4,application/pdf,audio/ogg"
              onChange={handleFile}
              ref={fileInputRef}
              style={{ display: "none" }}
            />
            <ActionIcon c="black" bg="white" onClick={handleFileButtonClick}>
              <RiAttachment2 size={20} />
            </ActionIcon>
            <ActionIcon onClick={handleEmojiClickButton} c="black" bg="white">
              <LuSmile size={20} />
            </ActionIcon>
          </Flex>
        </Flex>
      </Box>

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
