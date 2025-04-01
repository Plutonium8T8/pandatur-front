import React, { useState } from "react"
import { Link } from "react-router-dom"
import { BsThreeDots } from "react-icons/bs"
import {
  MdAccessTime,
  MdOutlineLocalPhone,
  MdModeEdit,
  MdDelete
} from "react-icons/md"
import { FaFingerprint } from "react-icons/fa6"
import { BsTagsFill } from "react-icons/bs"
import {
  Image,
  Box,
  DEFAULT_THEME,
  Card,
  Flex,
  Text,
  Divider,
  Menu,
  ActionIcon
} from "@mantine/core"
import { parseTags } from "../../../stringUtils"
import { parseServerDate, getLanguageByKey, showServerError } from "../../utils"
import { Modal } from "../../Modal"
import SingleChat from "../../ChatComponent/SingleChat"
import { Tag } from "../../Tag"
import { DEFAULT_PHOTO } from "../../../app-constants"
import { DD_MM_YYYY } from "../../../app-constants"
import { api } from "../../../api"
import { useConfirmPopup } from "../../../hooks"
import { useSnackbar } from "notistack"

const { colors } = DEFAULT_THEME

const formatDate = (date) => {
  return parseServerDate(date).format(DD_MM_YYYY)
}

export const priorityTagColors = {
  joasă: "green",
  medie: "blue",
  înaltă: "yelloy",
  critică: "red"
}

export const TicketCard = ({ ticket, onEditTicket }) => {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const deleteTicketById = useConfirmPopup({
    subTitle: getLanguageByKey("confirm_delete_lead")
  })
  const { enqueueSnackbar } = useSnackbar()

  const tags = parseTags(ticket.tags)

  const handleDeleteLead = (id) => {
    deleteTicketById(async () => {
      try {
        await api.tickets.deleteById([id])
        enqueueSnackbar(getLanguageByKey("lead_deleted_successfully"), {
          variant: "success"
        })
        // fetchTickets()
      } catch (error) {
        enqueueSnackbar(showServerError(error), {
          variant: "error"
        })
      }
    })
  }

  const firstClient = ticket.clients?.[0]

  return (
    <>
      <Link to={`/leads/${ticket.id}`} className="ticket-link">
        <Card
          withBorder
          shadow="sm"
          radius="lg"
          pos="relative"
          bg="white"
          p="8px"
        >
          <Box
            w="8"
            h="100%"
            pos="absolute"
            top="0"
            left="0"
            bg={priorityTagColors[ticket.priority] || "gray"}
          />

          <Box
            onClick={(e) => {
              console.log(e.target)
              e.preventDefault()
              e.stopPropagation()
            }}
            pos="absolute"
            right="16px"
            top="16px"
          >
            <Menu shadow="md">
              <Menu.Target>
                <ActionIcon variant="default">
                  <BsThreeDots />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  onClick={() => onEditTicket(ticket)}
                  leftSection={<MdModeEdit />}
                >
                  Edit
                </Menu.Item>

                <Divider />
                <Menu.Item
                  onClick={() => handleDeleteLead(ticket.id)}
                  color="red"
                  leftSection={<MdDelete />}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Box>

          <Box p="8">
            <Flex align="center" gap="xs">
              <Box w="48" h="48">
                <Image
                  src={ticket?.photo_url ? ticket.photo_url : DEFAULT_PHOTO}
                  fallbackSrc={DEFAULT_PHOTO}
                />
              </Box>

              <Box>
                {firstClient?.name && (
                  <Text fw="bold" c={colors.dark[4]}>
                    {firstClient?.name}
                  </Text>
                )}
                {ticket.contact && (
                  <Text c={colors.dark[4]}>{ticket.contact}</Text>
                )}

                <Flex c={colors.dark[3]} align="center" gap="4">
                  <MdAccessTime />
                  <Text size="xs">{formatDate(ticket.creation_date)}</Text>
                  {"-"}
                  <Text size="xs">
                    {formatDate(ticket.last_interaction_date)}
                  </Text>
                </Flex>
              </Box>
            </Flex>

            <Divider my="xs" />

            <Flex direction="column" gap="8" px="8">
              <Flex align="center" gap="8">
                <FaFingerprint />
                <Text>{ticket.clients?.[0].id}</Text>
              </Flex>

              {firstClient?.phone && (
                <Flex align="center" gap="8">
                  <MdOutlineLocalPhone />
                  <Text>{firstClient?.phone}</Text>
                </Flex>
              )}

              {!!tags.length && (
                <Flex align="center" gap="8">
                  <BsTagsFill />
                  {tags.map((tag) => (
                    <Tag>{tag}</Tag>
                  ))}
                </Flex>
              )}
            </Flex>
          </Box>
        </Card>
      </Link>

      <Modal
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        width={1850}
        height={1000}
        footer={null}
        showCloseButton={false}
      >
        <SingleChat ticketId={ticket.id} onClose={() => setIsChatOpen(false)} />
      </Modal>
    </>
  )
}
