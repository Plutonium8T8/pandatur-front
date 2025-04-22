import {
  Textarea,
  Flex,
  ActionIcon,
  Box,
  Button,
  Select,
  Loader,
  FileButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaPlus } from "react-icons/fa6";
import { useState } from "react";
import { createPortal } from "react-dom";
import EmojiPicker from "emoji-picker-react";
import { LuSmile } from "react-icons/lu";
import { RiAttachment2 } from "react-icons/ri";
import { getLanguageByKey, socialMediaIcons } from "../../../utils";
import { templateOptions } from "../../../../FormOptions";
import { useUploadMediaFile } from "../../../../hooks";
import { getMediaType } from "../../renderContent";
import "./ChatInput.css";

export const ChatInput = ({
  onSendMessage,
  onHandleFileSelect,
  clientList,
  onChangeClient,
  currentClient,
  loading,
  onCreateTask,
}) => {
  const [opened, handlers] = useDisclosure(false);
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [template, setTemplate] = useState();
  const [url, setUrl] = useState({});
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0,
  });

  const { uploadFile } = useUploadMediaFile();

  const handleEmojiClickButton = (event) => {
    const rect = event.target.getBoundingClientRect();
    const emojiPickerHeight = 450;

    setEmojiPickerPosition({
      top: rect.top + window.scrollY - emojiPickerHeight,
      left: rect.left + window.scrollX,
    });

    setShowEmojiPicker((prev) => !prev);
  };

  const handleFile = async (file) => {
    handlers.open();
    const url = await uploadFile(file);

    handlers.close();

    if (url) {
      setUrl({ media_url: url, media_type: getMediaType(file.type) });
      setMessage(url);
    }
  };

  const clearState = () => {
    setMessage("");
    setTemplate(null);
    setUrl(null);
  };

  const sendMessage = () => {
    if (message.trim()) {
      onSendMessage({
        message: message.trim(),
        ...url,
      });
      clearState();
    }
  };

  return (
    <>
      <Box className="chat-input" p="16">
        <Flex w="100%" gap="xs" mb="xs" align="center">
          {socialMediaIcons[currentClient?.payload?.platform] && (
            <Flex>{socialMediaIcons[currentClient.payload.platform]}</Flex>
          )}
          {loading ? (
            <Loader size="xs" />
          ) : (
            <Select
              className="w-full"
              onChange={(value) => {
                onChangeClient(value);
              }}
              placeholder={getLanguageByKey("selectUser")}
              value={currentClient?.value}
              data={clientList}
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
              disabled={
                !message.trim() ||
                !currentClient?.payload ||
                currentClient.payload.platform === "sipuni"
              }
              variant="filled"
              onClick={sendMessage}
              loading={opened}
            >
              {getLanguageByKey("Trimite")}
            </Button>

            <Button onClick={clearState} variant="default">
              {getLanguageByKey("Anulează")}
            </Button>
          </Flex>
          <Flex>
            <FileButton onChange={handleFile} accept="image/*,video/*,audio/*">
              {(props) => (
                <ActionIcon {...props} c="black" bg="white">
                  <RiAttachment2 size={20} />
                </ActionIcon>
              )}
            </FileButton>

            <ActionIcon onClick={handleEmojiClickButton} c="black" bg="white">
              <LuSmile size={20} />
            </ActionIcon>
            <ActionIcon
              onClick={onCreateTask}
              c="black"
              bg="white"
              title={getLanguageByKey("New Task")}
            >
              <FaPlus size={20} />
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
