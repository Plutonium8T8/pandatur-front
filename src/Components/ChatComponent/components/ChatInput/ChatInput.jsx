import { Textarea, Flex, ActionIcon, Box, Button, Text } from "@mantine/core";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import EmojiPicker from "emoji-picker-react";
import { LuSmile } from "react-icons/lu";
import { IoIosArrowDown } from "react-icons/io";
import { RiAttachment2 } from "react-icons/ri";
import { getLanguageByKey } from "../../../utils";
import { templateOptions } from "../../../../FormOptions";
import { ComboSelect } from "../../../ComboSelect";
import "./ChatInput.css";

export const ChatInput = ({
  onSendMessage,
  onHandleFileSelect,
  renderSelectUserPlatform,
  loading,
  clientList,
  onChangeClient,
}) => {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
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

  const clearState = () => {
    setMessage("");
  };

  const sendMessage = () => {
    if (message?.trim()) {
      onSendMessage(message);

      clearState();
    }
  };

  useEffect(() => {
    setSelectedClient(clientList[0]?.label);
  }, [clientList]);

  return (
    <>
      <Box p="16px">
        <Flex gap="xs" mb="xs" align="center">
          <ComboSelect
            position="top"
            renderTriggerButton={(closeDropdown) => (
              <Text
                className="pointer"
                c="blue "
                td="underline"
                onClick={closeDropdown}
              >
                {selectedClient ? `${selectedClient}:` : ""}
              </Text>
            )}
            onChange={(value) => {
              setSelectedClient(value);
              onChangeClient(value);
            }}
            data={clientList}
          />

          <ComboSelect
            position="top"
            renderTriggerButton={(closeDropdown) => (
              <ActionIcon size="xs" variant="default" onClick={closeDropdown}>
                <IoIosArrowDown />
              </ActionIcon>
            )}
            onChange={(value) =>
              setMessage(value ? templateOptions[value] : "")
            }
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
              disabled={!message}
              variant="filled"
              loading={loading}
              onClick={sendMessage}
            >
              {getLanguageByKey("Trimite")}
            </Button>

            <Button loading={loading} onClick={clearState} variant="default">
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
              <RiAttachment2 />
            </ActionIcon>
            <ActionIcon onClick={handleEmojiClickButton} c="black" bg="white">
              <LuSmile />
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
