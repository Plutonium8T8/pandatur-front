import React, { useState } from "react";
import {
  Box,
  TextInput,
  Textarea,
  Button,
  Flex,
  Stack,
  CloseButton,
  ActionIcon,
  FileButton,
  Group,
  Text,
  MultiSelect,
} from "@mantine/core";
import { FaEnvelope, FaPaperclip, FaTimes } from "react-icons/fa";
import { getLanguageByKey } from "../../../utils";
import { useUploadMediaFile } from "../../../../hooks";
import { getMediaType } from "../../renderContent";

export const EmailForm = ({ 
  onSend, 
  onCancel, 
  ticketId 
}) => {
  const [emailFields, setEmailFields] = useState({ 
    from: "", 
    to: [], 
    cc: [],
    subject: "", 
    body: "" 
  });
  const [attachments, setAttachments] = useState([]);
  const { uploadFile } = useUploadMediaFile();

  const handleFieldChange = (field, value) => {
    setEmailFields(prev => ({ ...prev, [field]: value }));
  };

  const handleAttachmentUpload = async (files) => {
    if (!files?.length) return;
    
    try {
      for (const file of files) {
        const url = await uploadFile(file);
        if (url) {
          const media_type = getMediaType(file.type);
          setAttachments(prev => [
            ...prev,
            { 
              media_url: url, 
              media_type, 
              name: file.name, 
              size: file.size,
              file: file
            },
          ]);
        }
      }
    } catch (e) {
      console.error("Failed to upload attachment:", e);
    }
  };

  const removeAttachment = (url) => {
    setAttachments(prev => prev.filter(att => att.media_url !== url));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSend = () => {
    const payload = {
      ticket_id: ticketId,
      ...emailFields,
      attachments: attachments.map(({ media_url, media_type, name, size }) => ({
        media_url,
        media_type,
        name,
        size,
      })),
    };
    
    onSend(payload);
  };

  const AttachmentPreview = ({ attachment }) => {
    const isImage = attachment.media_type === "image" || 
                   attachment.media_type === "photo" || 
                   attachment.media_type === "image_url";
    
    return (
      <Box
        style={{
          position: "relative",
          width: 80,
          height: 80,
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid var(--mantine-color-gray-3)",
          background: "#f8f9fa",
          marginBottom: 8,
        }}
      >
        {isImage ? (
          <img
            src={attachment.media_url}
            alt={attachment.name || "attachment"}
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover" 
            }}
          />
        ) : (
          <Flex 
            w="100%" 
            h="100%" 
            align="center" 
            justify="center"
            direction="column"
            gap={4}
          >
            <FaPaperclip size={16} color="#666" />
            <Text size="xs" c="dimmed" ta="center" style={{ fontSize: 10 }}>
              {attachment.media_type}
            </Text>
          </Flex>
        )}
        <CloseButton
          size="xs"
          onClick={() => removeAttachment(attachment.media_url)}
          style={{ 
            position: "absolute", 
            top: 2, 
            right: 2, 
            background: "rgba(255,255,255,0.9)",
            borderRadius: "50%"
          }}
        />
        <Box
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "2px 4px",
            fontSize: 10,
            textAlign: "center"
          }}
        >
          {formatFileSize(attachment.size)}
        </Box>
      </Box>
    );
  };

  return (
    <Box 
      style={{
        background: "white",
        border: "1px solid #dadce0",
        borderRadius: 8,
        boxShadow: "0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)",
        minHeight: 400,
      }}
    >
      {/* Header */}
      <Flex
        justify="space-between"
        align="center"
        p="12px 16px"
        style={{
          borderBottom: "1px solid #dadce0",
          background: "#f8f9fa",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <Group gap="xs">
          <FaEnvelope size={16} color="#5f6368" />
          <Text fw={500} size="sm" c="dark">
            {getLanguageByKey("Trimite Email")}
          </Text>
        </Group>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          onClick={onCancel}
        >
          <FaTimes size={14} />
        </ActionIcon>
      </Flex>

      {/* Form Content */}
      <Box p="16px">
        <Stack gap="md">
          {/* From Field */}
          <TextInput
            label={getLanguageByKey("emailFrom")}
            placeholder={getLanguageByKey("emailFrom")}
            value={emailFields.from}
            onChange={(e) => handleFieldChange("from", e.target.value)}
            styles={{
              label: { fontSize: 13, fontWeight: 500, color: "#5f6368" },
              input: { 
                border: "1px solid #dadce0",
                borderRadius: 4,
                fontSize: 14,
                "&:focus": {
                  borderColor: "#1a73e8",
                  boxShadow: "0 0 0 2px rgba(26,115,232,.2)"
                }
              }
            }}
          />

          {/* To Field */}
          <MultiSelect
            label={getLanguageByKey("emailTo")}
            placeholder={getLanguageByKey("emailTo")}
            value={emailFields.to}
            onChange={(value) => handleFieldChange("to", value)}
            searchable
            creatable
            getCreateLabel={(query) => `+ ${getLanguageByKey("Add email")} ${query}`}
            onCreate={(query) => query}
            data={[]}
            styles={{
              label: { fontSize: 13, fontWeight: 500, color: "#5f6368" },
              input: { 
                border: "1px solid #dadce0",
                borderRadius: 4,
                fontSize: 14,
                minHeight: "36px",
                "&:focus": {
                  borderColor: "#1a73e8",
                  boxShadow: "0 0 0 2px rgba(26,115,232,.2)"
                }
              }
            }}
          />

          {/* CC Field */}
          <MultiSelect
            label={getLanguageByKey("emailCc")}
            placeholder={getLanguageByKey("emailCc")}
            value={emailFields.cc}
            onChange={(value) => handleFieldChange("cc", value)}
            searchable
            creatable
            getCreateLabel={(query) => `+ ${getLanguageByKey("Add email")} ${query}`}
            onCreate={(query) => query}
            data={[]}
            styles={{
              label: { fontSize: 13, fontWeight: 500, color: "#5f6368" },
              input: { 
                border: "1px solid #dadce0",
                borderRadius: 4,
                fontSize: 14,
                minHeight: "36px",
                "&:focus": {
                  borderColor: "#1a73e8",
                  boxShadow: "0 0 0 2px rgba(26,115,232,.2)"
                }
              }
            }}
          />


          {/* Subject Field */}
          <TextInput
            label={getLanguageByKey("emailSubject")}
            placeholder={getLanguageByKey("emailSubject")}
            value={emailFields.subject}
            onChange={(e) => handleFieldChange("subject", e.target.value)}
            styles={{
              label: { fontSize: 13, fontWeight: 500, color: "#5f6368" },
              input: { 
                border: "1px solid #dadce0",
                borderRadius: 4,
                fontSize: 14,
                "&:focus": {
                  borderColor: "#1a73e8",
                  boxShadow: "0 0 0 2px rgba(26,115,232,.2)"
                }
              }
            }}
          />

          {/* Attachments */}
          {attachments.length > 0 && (
            <Box>
              <Text size="sm" fw={500} mb="xs" c="dark">
                {getLanguageByKey("Attachments")} ({attachments.length})
              </Text>
              <Flex wrap="wrap" gap="xs">
                {attachments.map((attachment) => (
                  <AttachmentPreview 
                    key={attachment.media_url} 
                    attachment={attachment} 
                  />
                ))}
              </Flex>
            </Box>
          )}

          {/* Message Body */}
          <Textarea
            label={getLanguageByKey("emailBody")}
            placeholder={getLanguageByKey("emailBody")}
            value={emailFields.body}
            onChange={(e) => handleFieldChange("body", e.target.value)}
            minRows={12}
            maxRows={20}
            styles={{
              label: { fontSize: 13, fontWeight: 500, color: "#5f6368" },
              input: { 
                border: "1px solid #dadce0",
                borderRadius: 4,
                fontSize: 14,
                resize: "vertical",
                minHeight: "200px",
                "&:focus": {
                  borderColor: "#1a73e8",
                  boxShadow: "0 0 0 2px rgba(26,115,232,.2)"
                }
              }
            }}
          />

          {/* Action Buttons */}
          <Flex justify="space-between" align="center" pt="md">
            <FileButton
              onChange={handleAttachmentUpload}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              multiple
            >
              {(props) => (
                <Button
                  {...props}
                  variant="outline"
                  leftSection={<FaPaperclip size={14} />}
                  size="sm"
                  styles={{
                    root: {
                      borderColor: "#dadce0",
                      color: "#5f6368",
                      "&:hover": {
                        backgroundColor: "#f8f9fa",
                        borderColor: "#1a73e8",
                        color: "#1a73e8"
                      }
                    }
                  }}
                >
                  {getLanguageByKey("Attach Files")}
                </Button>
              )}
            </FileButton>

            <Group gap="xs">
              <Button
                variant="outline"
                onClick={onCancel}
                size="sm"
                styles={{
                  root: {
                    borderColor: "#dadce0",
                    color: "#5f6368",
                    "&:hover": {
                      backgroundColor: "#f8f9fa"
                    }
                  }
                }}
              >
                {getLanguageByKey("Cancel")}
              </Button>
              <Button
                onClick={handleSend}
                size="sm"
                disabled={!emailFields.to.length || !emailFields.subject}
                styles={{
                  root: {
                    backgroundColor: "#1a73e8",
                    "&:hover": {
                      backgroundColor: "#1557b0"
                    },
                    "&:disabled": {
                      backgroundColor: "#dadce0",
                      color: "#5f6368"
                    }
                  }
                }}
              >
                {getLanguageByKey("Send")}
              </Button>
            </Group>
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
};
