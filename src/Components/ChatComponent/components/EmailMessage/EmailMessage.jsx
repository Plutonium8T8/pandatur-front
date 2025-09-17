import React, { useState } from "react";
import {
  Box,
  Card,
  Text,
  Group,
  Badge,
  Stack,
  Button,
  Modal,
  Image,
  Anchor,
  Divider,
} from "@mantine/core";
import { FaEnvelope, FaCode, FaPaperclip, FaDownload, FaImage } from "react-icons/fa";
import { getLanguageByKey } from "../../../utils";

export const EmailMessage = ({ message, platform_id, page_id }) => {
  const [modalOpened, setModalOpened] = useState(false);

  // Функция для определения типа файла
  const getFileType = (url, filename) => {
    const extension = filename?.split('.').pop()?.toLowerCase() || url?.split('.').pop()?.toLowerCase() || '';
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
    
    if (imageExtensions.includes(extension)) return 'image';
    if (documentExtensions.includes(extension)) return 'document';
    return 'file';
  };

  // Компонент для отображения attachment
  const AttachmentItem = ({ attachment }) => {
    const { url, filename, extension } = attachment;
    const fileType = getFileType(url, filename);
    const displayName = filename || `attachment.${extension || 'file'}`;

    if (fileType === 'image') {
      return (
        <Box style={{ maxWidth: '300px', marginBottom: '12px' }}>
          <Text size="xs" c="dimmed" mb="xs">
            <FaImage size={10} style={{ marginRight: '4px' }} />
            {displayName}
          </Text>
          <Image
            src={url}
            alt={displayName}
            style={{
              border: '1px solid #e9ecef',
              borderRadius: '4px',
              maxWidth: '100%',
              height: 'auto'
            }}
            fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjhmOWZhIi8+Cjx0ZXh0IHg9IjEyIiB5PSIxMiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNmM3NTdkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPgo="
          />
          <Anchor
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <FaDownload size={10} />
            {getLanguageByKey("Download")}
          </Anchor>
        </Box>
      );
    }

    return (
      <Box style={{ marginBottom: '12px' }}>
        <Group gap="xs" align="center">
          <FaPaperclip size={12} color="#6c757d" />
          <Text size="sm" c="dark">
            {displayName}
          </Text>
          <Anchor
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <FaDownload size={10} />
            {getLanguageByKey("Download")}
          </Anchor>
        </Group>
      </Box>
    );
  };

  try {
    const emailData = JSON.parse(message);

    const {
      from,
      to,
      subject,
      html,
      attachments = []
    } = emailData;

    const formatEmailList = (emailList) => {
      if (!emailList) return "";
      if (typeof emailList === "string") return emailList;
      if (Array.isArray(emailList)) return emailList.join(", ");
      return String(emailList);
    };

    return (
      <>
        <Card
          shadow="sm"
          padding="md"
          radius="md"
          withBorder
          style={{
            maxWidth: "500px",
            backgroundColor: "#f8f9fa",
            border: "1px solid #e9ecef",
          }}
        >
          <Stack gap="sm">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
              <Group gap="xs">
                <FaEnvelope size={16} color="#6c757d" />
                <Text fw={600} size="sm" c="dark">
                  {getLanguageByKey("Email")}
                </Text>
              </Group>
              <Button
                size="xs"
                variant="light"
                leftSection={<FaCode size={10} />}
                onClick={() => setModalOpened(true)}
              >
                {getLanguageByKey("View HTML")}
              </Button>
            </Group>

            {/* Email Details */}
            <Stack gap="xs">
              <Box>
                <Text size="xs" c="dimmed" fw={500} mb="2px">
                  {getLanguageByKey("emailFrom")}:
                </Text>
                <Text size="sm" c="dark">
                  {formatEmailList(from)}
                </Text>
              </Box>

              <Box>
                <Text size="xs" c="dimmed" fw={500} mb="2px">
                  {getLanguageByKey("emailTo")}:
                </Text>
                <Text size="sm" c="dark">
                  {formatEmailList(to)}
                </Text>
              </Box>

              <Box>
                <Text size="xs" c="dimmed" fw={500} mb="2px">
                  {getLanguageByKey("emailSubject")}:
                </Text>
                <Text size="sm" c="dark" fw={500}>
                  {subject || getLanguageByKey("No subject")}
                </Text>
              </Box>

              {/* Attachments indicator */}
              {attachments && attachments.length > 0 && (
                <Group gap="xs">
                  <FaPaperclip size={12} color="#6c757d" />
                  <Text size="xs" c="dimmed">
                    {attachments.length} {getLanguageByKey("attachment")}
                    {attachments.length !== 1 ? "s" : ""}
                  </Text>
                </Group>
              )}

            </Stack>
          </Stack>
        </Card>

        {/* HTML Modal */}
        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title={
            <Group gap="xs">
              <FaEnvelope size={16} color="#6c757d" />
              <Text fw={600}>{getLanguageByKey("Email")}</Text>
            </Group>
          }
          size="95%"
          centered
          styles={{
            content: {
              height: "95vh",
              maxHeight: "95vh",
            },
            body: {
              height: "calc(95vh - 60px)",
              padding: "20px",
            }
          }}
        >
          <Stack gap="md">
            {/* Email Info */}
            <Box>
              <Text size="sm" c="dimmed" mb="xs">
                <strong>{getLanguageByKey("emailFrom")}:</strong> {formatEmailList(from)}
              </Text>
              <Text size="sm" c="dimmed" mb="xs">
                <strong>{getLanguageByKey("emailTo")}:</strong> {formatEmailList(to)}
              </Text>
              <Text size="sm" c="dimmed" mb="md">
                <strong>{getLanguageByKey("emailSubject")}:</strong> {subject || getLanguageByKey("No subject")}
              </Text>
            </Box>

            {/* Attachments */}
            {attachments && attachments.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Group gap="xs" mb="md">
                    <FaPaperclip size={14} color="#6c757d" />
                    <Text fw={600} size="sm">
                      {getLanguageByKey("Attachments")} ({attachments.length})
                    </Text>
                  </Group>
                  {attachments.map((attachment, index) => (
                    <AttachmentItem key={index} attachment={attachment} />
                  ))}
                </Box>
                <Divider />
              </>
            )}

            {/* HTML Content */}
            {html && (
              <Box>
                <Text fw={600} size="sm" mb="md">
                  {getLanguageByKey("Email content")}:
                </Text>
                <Box
                  p="md"
                  style={{
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #e9ecef",
                    borderRadius: "4px",
                  }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </Box>
            )}
          </Stack>
        </Modal>
      </>
    );
  } catch (error) {
    // Fallback for invalid JSON
    return (
      <Card
        shadow="sm"
        padding="md"
        radius="md"
        withBorder
        style={{
          maxWidth: "500px",
          backgroundColor: "#f8f9fa",
          border: "1px solid #e9ecef",
        }}
      >
        <Group gap="xs" mb="xs">
          <FaEnvelope size={16} color="#6c757d" />
          <Text fw={600} size="sm" c="dark">
            {getLanguageByKey("Email")}
          </Text>
          <Badge size="sm" variant="light" color="red">
            {getLanguageByKey("Invalid format")}
          </Badge>
        </Group>
        <Text size="sm" c="dimmed" style={{ fontFamily: "monospace" }}>
          {message}
        </Text>
      </Card>
    );
  }
};
