import { Modal, Tabs, Text } from "@mantine/core"
import { useSnackbar } from "notistack"
import { useState } from "react"
import { getLanguageByKey, showServerError } from "../../utils"

import { api } from "../../../api"
import {
  TicketInfoForm,
  GeneralInfoTicketForm,
  ContractTicketForm
} from "../components"
export const EditBulkLeadsModal = ({ open, onClose, selectedTickets }) => {
  const { enqueueSnackbar } = useSnackbar()

  const [loading, setLoading] = useState(false)

  const submit = async (values) => {
    setLoading(true)
    try {
      await api.tickets.updateById({
        id: selectedTickets,
        ...values
      })
      onClose(true)
      enqueueSnackbar(
        getLanguageByKey("Datele au fost actualizate cu success"),
        {
          variant: "success"
        }
      )
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      centered
      opened={open}
      onClose={() => onClose()}
      size="lg"
      title={
        <Text size="xl" fw="bold">
          {getLanguageByKey("Editarea tichetelor în grup")}
        </Text>
      }
    >
      <Tabs defaultValue="general_info">
        <Tabs.List>
          <Tabs.Tab value="general_info">
            {getLanguageByKey("Informații generale")}
          </Tabs.Tab>
          <Tabs.Tab value="ticket_info">
            {getLanguageByKey("Informații despre tichet")}
          </Tabs.Tab>
          <Tabs.Tab value="contact">{getLanguageByKey("Contact")}</Tabs.Tab>
          <Tabs.Tab value="invoice">{getLanguageByKey("Invoice")}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general_info" pt="xs">
          <GeneralInfoTicketForm
            onClose={onClose}
            onSubmit={submit}
            loading={loading}
          />
        </Tabs.Panel>

        <Tabs.Panel value="ticket_info" pt="xs">
          <TicketInfoForm
            onClose={onClose}
            onSubmit={submit}
            loading={loading}
          />
        </Tabs.Panel>
        <Tabs.Panel value="contact" pt="xs">
          <ContractTicketForm
            onClose={onClose}
            onSubmit={submit}
            loading={loading}
          />
        </Tabs.Panel>
        <Tabs.Panel value="invoice" pt="xs">
          Invoice
        </Tabs.Panel>
      </Tabs>
    </Modal>
  )
}
