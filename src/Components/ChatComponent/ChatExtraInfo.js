import React, { useState, useEffect } from "react"
import { enqueueSnackbar } from "notistack"
import { api } from "../../api"
import { translations } from "../utils/translations"
import { Tabs, ScrollArea, Flex, Divider, Box, Button } from "@mantine/core"
import { Media } from "./Media"
import { PersonalData } from "./PersonalData"
import { Merge } from "./Merge"
import { getLanguageByKey, showServerError } from "../utils"
import {
  ContractForm,
  QualityControlForm,
  InvoiceForm,
  GeneralForm,
  TicketInfoForm
} from "../TicketForm"

const FORMAT_MEDIA = ["audio", "video", "image", "file"]

const parseId = (id) => {
  return Number(id.replace(/[{}]/g, "").trim())
}

const ChatExtraInfo = ({
  selectTicketId,
  personalInfo = {},
  setPersonalInfo,

  messages = [],
  updatedTicket,
  updateTicket,
  isLoading,
  ticketId,
  selectedClient,
  setTickets,
  tickets
}) => {
  const [extraInfo, setExtraInfo] = useState({})
  const [isLoadingGeneral, setIsLoadingGeneral] = useState(false)
  const [isLoadingPersonalDate, setIsLoadingPersonalDate] = useState(false)
  const [isLoadingCombineLead, setIsLoadingCombineLead] = useState(false)
  const [isLoadingCombineClient, setIsLoadingClient] = useState(false)
  const [isLoadingInfoTicket, setIsLoadingInfoTicket] = useState(false)

  useEffect(() => {
    if (selectTicketId) {
      fetchTicketExtraInfo(selectTicketId)
    }
  }, [selectTicketId])

  const updateTicketDate = async (values) => {
    setIsLoadingGeneral(true)
    try {
      await api.tickets.updateById({
        id: [selectTicketId],
        ...values
      })
      enqueueSnackbar(
        getLanguageByKey("Datele despre ticket au fost create cu succes"),
        {
          variant: "success"
        }
      )
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error"
      })
    } finally {
      setIsLoadingGeneral(false)
    }
  }

  const fetchTicketExtraInfo = async (ticketId) => {
    try {
      const data = await api.tickets.ticket.getInfo(ticketId)
      setExtraInfo((prev) => ({
        ...prev,
        [ticketId]: data
      }))
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error"
      })
    }
  }

  const handleFieldChange = (field, value) => {
    setExtraInfo((prevState) => ({
      ...prevState,
      [selectTicketId]: {
        ...prevState[selectTicketId],
        [field]: value
      }
    }))
  }

  const submitPersonalData = async (values) => {
    const clientId = parseId(updatedTicket.client_id)
    setIsLoadingPersonalDate(true)
    try {
      const result = await api.users.updateExtended(clientId, values)

      enqueueSnackbar(
        getLanguageByKey("Datele despre ticket au fost create cu succes"),
        { variant: "success" }
      )

      setPersonalInfo((prev) => ({
        ...prev,
        [clientId]: {
          name: result.name || "",
          surname: result.surname || "",
          address: result.address || "",
          phone: result.phone || ""
        }
      }))
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error"
      })
    } finally {
      setIsLoadingPersonalDate(false)
    }
  }

  useEffect(() => {
    setExtraInfo({})
  }, [selectTicketId])

  useEffect(() => {
    const pretNetto = extraInfo[selectTicketId]?.pret_netto
    const buget = extraInfo[selectTicketId]?.buget

    if (
      pretNetto !== "" &&
      buget !== "" &&
      pretNetto !== undefined &&
      buget !== undefined
    ) {
      const newComision = parseFloat(buget) - parseFloat(pretNetto)
      handleFieldChange("comission_companie", newComision.toFixed(2))
    }
  }, [
    extraInfo[selectTicketId]?.pret_netto,
    extraInfo[selectTicketId]?.buget,
    selectTicketId
  ])

  const mediaSources = messages.filter(
    (msg) =>
      FORMAT_MEDIA.includes(msg.mtype) && msg.ticket_id === selectTicketId
  )

  const mergeCLientsData = async (id) => {
    const ticketOld = selectTicketId

    setIsLoadingCombineLead(true)
    try {
      await api.tickets.merge({
        ticket_old: ticketOld,
        ticket_new: id
      })
      enqueueSnackbar(
        getLanguageByKey("Biletele au fost combinate cu succes"),
        {
          variant: "success"
        }
      )
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error"
      })
    } finally {
      setIsLoadingCombineLead(false)
    }
  }

  const mergeData = async (id) => {
    const oldUserId = selectedClient

    setIsLoadingClient(true)
    try {
      await api.users.clientMerge({
        old_user_id: oldUserId,
        new_user_id: id
      })

      enqueueSnackbar(
        getLanguageByKey("Utilizatorii au fost combinați cu succes"),
        {
          variant: "success"
        }
      )
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error"
      })
    } finally {
      setIsLoadingClient(false)
    }
  }

  const saveTicketExtraDate = async (values) => {
    setIsLoadingInfoTicket(true)
    try {
      await api.tickets.ticket.create(selectTicketId, values)

      enqueueSnackbar(
        getLanguageByKey("Datele despre ticket au fost create cu succes"),
        { variant: "success" }
      )
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error"
      })
    } finally {
      setIsLoadingInfoTicket(false)
    }
  }

  useEffect(() => {
    if (!selectedClient) return

    const clientId = parseId(selectedClient)

    const clientData =
      tickets
        .find((ticket) => ticket.id === selectTicketId)
        ?.clients?.find((client) => client.id === clientId) || {}

    if (clientData) {
      setPersonalInfo((prev) => ({
        ...prev,
        [clientId]: {
          name: clientData.name || "",
          surname: clientData.surname || "",
          address: clientData.address || "",
          phone: clientData.phone || ""
        }
      }))
    }
  }, [selectedClient, selectTicketId, tickets, setPersonalInfo])

  return (
    <ScrollArea maw="30%" w="100%" h="100%">
      <Tabs defaultValue="general">
        <Tabs.List>
          <Tabs.Tab value="general">{getLanguageByKey("General")}</Tabs.Tab>
          <Tabs.Tab value="info">
            {getLanguageByKey("Informații despre tichet")}
          </Tabs.Tab>
          <Tabs.Tab value="contract">{getLanguageByKey("Contract")}</Tabs.Tab>
          <Tabs.Tab value="invoice">{getLanguageByKey("Invoice")}</Tabs.Tab>
          {!!mediaSources.length && (
            <Tabs.Tab value="media">{getLanguageByKey("Media")}</Tabs.Tab>
          )}
          <Tabs.Tab value="quality_control">
            {getLanguageByKey("Control calitate")}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general">
          <Flex p="md" direction="column">
            <GeneralForm
              data={updatedTicket}
              onSubmit={(values) => updateTicketDate(values)}
              renderFooterButtons={({ formId }) => (
                <Button loading={isLoadingGeneral} type="submit" form={formId}>
                  {getLanguageByKey("Actualizare")}
                </Button>
              )}
            />

            <Divider my="md" />

            <PersonalData
              loading={isLoadingPersonalDate}
              data={personalInfo[selectedClient]}
              onSubmit={(values) => submitPersonalData(values)}
            />

            <Divider my="md" />

            <Merge
              loading={isLoadingCombineLead}
              value={selectedClient}
              onSubmit={(values) => mergeCLientsData(values)}
              placeholder={getLanguageByKey("Introduceți ID lead")}
            />

            <Box mt="md">
              <Merge
                loading={isLoadingCombineClient}
                value={ticketId}
                placeholder={getLanguageByKey("Introduceți ID client")}
                onSubmit={(values) => mergeData(values)}
              />
            </Box>
          </Flex>
        </Tabs.Panel>

        <Tabs.Panel value="info">
          <Flex p="md" direction="column">
            <TicketInfoForm
              data={extraInfo[selectTicketId]}
              onSubmit={(values) => saveTicketExtraDate(values)}
              renderFooterButtons={({ formId }) => (
                <Button
                  loading={isLoadingInfoTicket}
                  type="submit"
                  form={formId}
                >
                  {getLanguageByKey("Actualizare")}
                </Button>
              )}
            />
          </Flex>
        </Tabs.Panel>

        <Tabs.Panel value="contract">
          <Flex p="md" direction="column">
            <ContractForm
              data={extraInfo[selectTicketId]}
              onSubmit={(values) => saveTicketExtraDate(values)}
              renderFooterButtons={({ formId }) => (
                <Button
                  loading={isLoadingInfoTicket}
                  type="submit"
                  form={formId}
                >
                  {getLanguageByKey("Actualizare")}
                </Button>
              )}
            />
          </Flex>
        </Tabs.Panel>

        <Tabs.Panel value="invoice">
          <Flex p="md" direction="column">
            <InvoiceForm
              data={extraInfo[selectTicketId]}
              onSubmit={(values) => saveTicketExtraDate(values)}
              renderFooterButtons={({ formId }) => (
                <Button
                  loading={isLoadingInfoTicket}
                  type="submit"
                  form={formId}
                >
                  {getLanguageByKey("Actualizare")}
                </Button>
              )}
            />
          </Flex>
        </Tabs.Panel>
        {!!mediaSources.length && (
          <Tabs.Panel value="media">
            <Media messages={mediaSources} />
          </Tabs.Panel>
        )}

        <Tabs.Panel value="quality_control">
          <Flex p="md" direction="column">
            <QualityControlForm
              isSelect
              data={extraInfo[selectTicketId]}
              onSubmit={(values) => saveTicketExtraDate(values)}
              renderFooterButtons={({ formId }) => (
                <Button
                  loading={isLoadingInfoTicket}
                  type="submit"
                  form={formId}
                >
                  {getLanguageByKey("Actualizare")}
                </Button>
              )}
            />
          </Flex>
        </Tabs.Panel>
      </Tabs>
    </ScrollArea>
  )
}

export default ChatExtraInfo
