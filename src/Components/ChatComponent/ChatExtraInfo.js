import React, { useState, useEffect } from "react"
import { useUser } from "../../hooks"
import { enqueueSnackbar } from "notistack"
import { api } from "../../api"
import { translations } from "../utils/translations"
import { Tabs, ScrollArea, Flex, Divider, Box } from "@mantine/core"
import {
  TicketInfoForm,
  ContractTicketForm,
  Invoice,
  QualityControl,
  GeneralInfoTicketForm
} from "../LeadsComponent/components"
import { Media } from "./Media"
import { PersonalData } from "./PersonalData"
import { Merge } from "./Merge"
import { getLanguageByKey, showServerError } from "../utils"

const parseId = (id) => {
  return Number(id.replace(/[{}]/g, "").trim())
}

const language = localStorage.getItem("language") || "RO"

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
  const { hasRole } = useUser()
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
    <Box maw="30%" w="100%">
      <ScrollArea>
        <Tabs defaultValue="general">
          <Tabs.List>
            <Tabs.Tab value="general">General</Tabs.Tab>
            <Tabs.Tab value="info">Info</Tabs.Tab>
            <Tabs.Tab value="contract">Contract</Tabs.Tab>
            <Tabs.Tab value="invoice">Invoice</Tabs.Tab>
            <Tabs.Tab value="media">Media</Tabs.Tab>
            <Tabs.Tab value="quality_control">Control calitate</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="general">
            <Flex p="md" direction="column">
              <GeneralInfoTicketForm
                loading={isLoadingGeneral}
                data={updatedTicket}
                onSubmit={(values) => updateTicketDate(values)}
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
                placeholder={translations?.["Introduceți ID lead"]?.[language]}
              />

              <Box mt="md">
                <Merge
                  loading={isLoadingCombineClient}
                  value={ticketId}
                  placeholder={
                    translations?.["Introduceți ID client"][language]
                  }
                  onSubmit={(values) => mergeData(values)}
                />
              </Box>
            </Flex>
          </Tabs.Panel>

          <Tabs.Panel value="info">
            <Flex p="md" direction="column">
              <TicketInfoForm
                loading={isLoadingInfoTicket}
                data={extraInfo[selectTicketId]}
                onSubmit={(values) => saveTicketExtraDate(values)}
              />
            </Flex>
          </Tabs.Panel>

          <Tabs.Panel value="contract">
            <Flex p="md" direction="column">
              <ContractTicketForm
                loading={isLoadingInfoTicket}
                data={extraInfo[selectTicketId]}
                onSubmit={(values) => saveTicketExtraDate(values)}
              />
            </Flex>
          </Tabs.Panel>

          <Tabs.Panel value="invoice">
            <Flex p="md" direction="column">
              <Invoice
                loading={isLoadingInfoTicket}
                data={extraInfo[selectTicketId]}
                onSubmit={(values) => saveTicketExtraDate(values)}
              />
            </Flex>
          </Tabs.Panel>
          <Tabs.Panel value="media">
            <Media messages={messages} selectTicketId={selectTicketId} />
          </Tabs.Panel>

          <Tabs.Panel value="quality_control">
            <Flex p="md" direction="column">
              <QualityControl
                loading={isLoadingInfoTicket}
                data={extraInfo[selectTicketId]}
                onSubmit={(values) => saveTicketExtraDate(values)}
              />
            </Flex>
          </Tabs.Panel>
        </Tabs>
      </ScrollArea>
    </Box>
  )
}

export default ChatExtraInfo
