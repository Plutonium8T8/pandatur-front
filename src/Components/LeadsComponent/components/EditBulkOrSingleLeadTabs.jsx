import { Tabs, Flex, Button } from "@mantine/core"
import { useSnackbar } from "notistack"
import { useState, useEffect } from "react"
import { getLanguageByKey, showServerError } from "../../utils"
import { api } from "../../../api"
import {
  TicketInfoForm,
  GeneralInfoTicketForm,
  ContractTicketForm
} from "../components"

export const EditBulkOrSingleLeadTabs = ({
  open,
  onClose,
  selectedTickets,
  fetchLeads,
  id
}) => {
  const { enqueueSnackbar } = useSnackbar()

  const [loading, setLoading] = useState(false)
  const [ticketInfo, setTicketInfo] = useState()
  const [generalInfoLightTicket, setGeneralInfoLightTicket] = useState()

  const submit = async (values, callback) => {
    setLoading(true)
    try {
      await api.tickets.updateById({
        id: id ? [id] : selectedTickets,
        ...values
      })
      onClose(true)
      callback()
      enqueueSnackbar(
        getLanguageByKey("Datele au fost actualizate cu success"),
        {
          variant: "success"
        }
      )
      await fetchLeads()
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const getTicketInfo = async (id) => {
      setLoading(true)
      try {
        const lightTicket = await api.tickets.ticket.getLightById(id)
        const ticketInfo = await api.tickets.ticket.getInfo(id)
        setGeneralInfoLightTicket(lightTicket)
        setTicketInfo(ticketInfo)
      } catch (error) {
        enqueueSnackbar(showServerError(error), { variant: "error" })
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      getTicketInfo(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <Tabs h="100%" defaultValue="general_info">
      <Tabs.List>
        <Tabs.Tab value="general_info">
          {getLanguageByKey("Informații generale")}
        </Tabs.Tab>
        <Tabs.Tab value="ticket_info">
          {getLanguageByKey("Informații despre tichet")}
        </Tabs.Tab>
        <Tabs.Tab value="contact">{getLanguageByKey("Contact")}</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="general_info" pt="xs">
        <Flex direction="column" justify="space-between" h="100%">
          <GeneralInfoTicketForm
            data={generalInfoLightTicket}
            onSubmit={submit}
            renderFooterButtons={({ formId }) => (
              <>
                <Button variant="default" onClick={onClose}>
                  {getLanguageByKey("Închide")}
                </Button>
                <Button loading={loading} type="submit" form={formId}>
                  {getLanguageByKey("Trimite")}
                </Button>
              </>
            )}
          />
        </Flex>
      </Tabs.Panel>

      <Tabs.Panel value="ticket_info" pt="xs" pb="md">
        <TicketInfoForm
          setMinDate={new Date()}
          data={ticketInfo}
          onSubmit={submit}
          renderFooterButtons={({ formId }) => (
            <>
              <Button variant="default" onClick={onClose}>
                {getLanguageByKey("Închide")}
              </Button>
              <Button loading={loading} type="submit" form={formId}>
                {getLanguageByKey("Trimite")}
              </Button>
            </>
          )}
        />
      </Tabs.Panel>
      <Tabs.Panel value="contact" pt="xs" pb="md">
        <ContractTicketForm
          setMinDate={new Date()}
          data={ticketInfo}
          onSubmit={submit}
          renderFooterButtons={({ formId }) => (
            <>
              <Button variant="default" onClick={onClose}>
                {getLanguageByKey("Închide")}
              </Button>
              <Button loading={loading} type="submit" form={formId}>
                {getLanguageByKey("Trimite")}
              </Button>
            </>
          )}
        />
      </Tabs.Panel>
    </Tabs>
  )
}
