import { Tabs, Flex, Button, ScrollArea } from "@mantine/core";
import { getLanguageByKey } from "../utils";
import {
  TicketInfoFormFilter,
  ContractFormFilter,
  InvoiceFormFilter,
  QualityControlFormFilter,
  BasicGeneralFormFilter,
} from "./components";
import "./TicketFormTabs.css";

const renderResetButton = (resetForm) => {
  return (
    <Button variant="outline" onClick={resetForm}>
      {getLanguageByKey("Reset filter")}
    </Button>
  );
};

const formIds = {
  general: "generalForm",
  ticketInfo: "ticketInfoForm",
  contract: "contractForm",
  invoice: "invoiceForm",
};

export const TicketFormTabs = ({
  onClose,
  onSubmit,
  loading,
  initialData,
  orientation = "vertical",
}) => {
  return (
    <Tabs
      h="100%"
      defaultValue="filter_general_info"
      orientation={orientation}
      className="leads-modal-filter-tabs"
    >
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
        {/* <Tabs.Tab value="filter_invoice">
          {getLanguageByKey("Invoice")}
        </Tabs.Tab> */}
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
          <BasicGeneralFormFilter
            data={initialData}
            loading={loading}
            onClose={onClose}
            onSubmit={onSubmit}
            renderFooterButtons={renderResetButton}
            formId={formIds.general}
          />
        </Flex>
      </Tabs.Panel>
      <Tabs.Panel pl="lg" value="filter_ticket_info">
        <ScrollArea h="100%">
          <TicketInfoFormFilter
            data={initialData}
            hideDisabledInput
            onSubmit={onSubmit}
            renderFooterButtons={({ onResetForm, formId }) => (
              <>
                {renderResetButton(onResetForm)}
                <Button variant="default" onClick={onClose}>
                  {getLanguageByKey("Închide")}
                </Button>
                <Button loading={loading} type="submit" form={formId}>
                  {getLanguageByKey("Aplică")}
                </Button>
              </>
            )}
            formId={formIds.ticketInfo}
          />
        </ScrollArea>
      </Tabs.Panel>
      <Tabs.Panel pl="lg" value="filter_contract">
        <ScrollArea h="100%">
          <ContractFormFilter
            data={initialData}
            hideDisabledInput
            onSubmit={onSubmit}
            renderFooterButtons={({ onResetForm, formId }) => (
              <>
                {renderResetButton(onResetForm)}
                <Button variant="default" onClick={onClose}>
                  {getLanguageByKey("Închide")}
                </Button>
                <Button loading={loading} type="submit" form={formId}>
                  {getLanguageByKey("Aplică")}
                </Button>
              </>
            )}
            formId={formIds.contract}
          />
        </ScrollArea>
      </Tabs.Panel>

      <Tabs.Panel pl="lg" value="filter_invoice">
        <Flex direction="column" justify="space-between" h="100%">
          <InvoiceFormFilter
            data={initialData}
            onSubmit={onSubmit}
            renderFooterButtons={({ onResetForm, formId }) => (
              <>
                {renderResetButton(onResetForm)}
                <Button variant="default" onClick={onClose}>
                  {getLanguageByKey("Închide")}
                </Button>
                <Button loading={loading} type="submit" form={formId}>
                  {getLanguageByKey("Aplică")}
                </Button>
              </>
            )}
            formId={formIds.invoice}
          />
        </Flex>
      </Tabs.Panel>

      <Tabs.Panel pl="lg" value="filter_quality_control">
        <Flex direction="column" justify="space-between" h="100%">
          <QualityControlFormFilter
            data={initialData}
            onSubmit={onSubmit}
            renderFooterButtons={({ onResetForm, formId }) => (
              <>
                {renderResetButton(onResetForm)}
                <Button variant="default" onClick={onClose}>
                  {getLanguageByKey("Închide")}
                </Button>
                <Button loading={loading} type="submit" form={formId}>
                  {getLanguageByKey("Aplică")}
                </Button>
              </>
            )}
          />
        </Flex>
      </Tabs.Panel>
    </Tabs>
  );
};
