import { Tabs, Flex, Button, ScrollArea } from "@mantine/core"
import {
  TicketInfoForm,
  ContractTicketForm,
  GeneralInfoTicketForm,
  Invoice,
  QualityControl
} from "../../LeadsComponent/components"
import { getLanguageByKey } from "../../utils"

const renderResetButton = (resetForm) => {
  return (
    <Button variant="outline" onClick={resetForm}>
      {getLanguageByKey("Reset filter")}
    </Button>
  )
}

export const TicketsFilter = ({ onClose, onSubmit, loading }) => {
  return (
    <Tabs defaultValue="filter_general_info" orientation="vertical">
      <Tabs.List>
        <Tabs.Tab value="filter_general_info">
          {getLanguageByKey("Informații generale")}
        </Tabs.Tab>
        <Tabs.Tab value="filter_ticket_info">
          {getLanguageByKey("Informații despre tichet")}
        </Tabs.Tab>
        <Tabs.Tab value="filter_contract">
          {getLanguageByKey("Contract")}
        </Tabs.Tab>
        <Tabs.Tab value="filter_invoice">
          {getLanguageByKey("Invoice")}
        </Tabs.Tab>
        <Tabs.Tab value="filter_quality_control">
          {getLanguageByKey("Control calitate")}
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel
        className="general-information-filter"
        pl="lg"
        value="filter_general_info"
      >
        <Flex direction="column" justify="space-between" h="100%">
          <GeneralInfoTicketForm
            loading={loading}
            onClose={onClose}
            onSubmit={onSubmit}
            renderFooterButtons={renderResetButton}
          />
        </Flex>
      </Tabs.Panel>
      <Tabs.Panel pl="lg" value="filter_ticket_info">
        <ScrollArea h="100%">
          <TicketInfoForm
            hideDisabledInput
            loading={loading}
            onClose={onClose}
            onSubmit={onSubmit}
            renderFooterButtons={renderResetButton}
          />
        </ScrollArea>
      </Tabs.Panel>
      <Tabs.Panel pl="lg" value="filter_contract">
        <ScrollArea h="100%">
          <ContractTicketForm
            hideDisabledInput
            loading={loading}
            onClose={onClose}
            onSubmit={onSubmit}
            renderFooterButtons={renderResetButton}
          />
        </ScrollArea>
      </Tabs.Panel>

      <Tabs.Panel pl="lg" value="filter_invoice">
        <Flex direction="column" justify="space-between" h="100%">
          <Invoice
            loading={loading}
            onClose={onClose}
            onSubmit={onSubmit}
            renderFooterButtons={renderResetButton}
          />
        </Flex>
      </Tabs.Panel>

      <Tabs.Panel pl="lg" value="filter_quality_control">
        <Flex direction="column" justify="space-between" h="100%">
          <QualityControl
            onSubmit={onSubmit}
            loading={loading}
            onClose={onClose}
            renderFooterButtons={renderResetButton}
          />
        </Flex>
      </Tabs.Panel>
    </Tabs>
  )
}
