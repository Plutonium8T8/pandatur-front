import { Textarea, Flex, ActionIcon, Box, Button, Text } from "@mantine/core";
import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import EmojiPicker from "emoji-picker-react";
import { LuSmile } from "react-icons/lu";
import { IoIosArrowDown } from "react-icons/io";
import { RiAttachment2 } from "react-icons/ri";
import { FaFingerprint } from "react-icons/fa6";
import {
  getLanguageByKey,
  socialMediaIcons,
  getFullName,
} from "../../../utils";
import { templateOptions } from "../../../../FormOptions";
import { ComboSelect } from "../../../ComboSelect";
import "./ChatInput.css";

export const ChatInput = ({
  onSendMessage,
  onHandleFileSelect,
  loading,
  clientList,
  onChangeClient,
  currentClient,
}) => {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0,
  });

  const userList = useMemo(() => {
    return clientList?.map(({ payload, value }) => {
      const fullName = getFullName(payload.name, payload.surname);

      return {
        value,
        label: (
          <Flex align="center" gap="8">
            <Flex align="center" gap="4">
              {!fullName && <FaFingerprint size="12" />}
              {fullName || payload.id}
            </Flex>
            {socialMediaIcons[payload?.platform]}
          </Flex>
        ),
        payload: {
          id: payload.id,
          platform: payload.platform,
        },
      };
    });
  }, [clientList]);

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
    setSelectedClient(
      userList.find(
        ({ payload }) =>
          payload.id === currentClient.payload?.id &&
          payload.platform === currentClient.payload?.platform,
      ),
    );
  }, [currentClient, userList]);

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
                {selectedClient?.label ? selectedClient?.label : ""}
              </Text>
            )}
            onChange={(value) => {
              setSelectedClient(
                userList.find((client) => client.value === value),
              );
              onChangeClient(value);
            }}
            data={userList}
          />

          <ComboSelect
            position="top"
            currentValue={currentClient.value}
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
