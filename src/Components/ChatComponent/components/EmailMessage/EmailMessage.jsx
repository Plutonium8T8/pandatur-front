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
} from "@mantine/core";
import { FaEnvelope, FaCode, FaPaperclip } from "react-icons/fa";
import { getLanguageByKey } from "../../../utils";

export const EmailMessage = ({ message, platform_id, page_id }) => {
  const [modalOpened, setModalOpened] = useState(false);

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

            {/* HTML Content */}
            <Box
              p="md"
              style={{
                backgroundColor: "#f8f9fa",
                border: "1px solid #e9ecef",
                borderRadius: "4px",
              }}
              dangerouslySetInnerHTML={{ __html: html || "" }}
            />
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
