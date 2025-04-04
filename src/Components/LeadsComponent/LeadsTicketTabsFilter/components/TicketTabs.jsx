import { Tabs, Flex, Button, ScrollArea } from "@mantine/core";
import { getLanguageByKey } from "../../../utils";
import { TicketInfoForm } from "./TicketInfoForm";
import { ContractForm } from "./ContractForm";
import { InvoiceForm } from "./InvoiceForm";
import { QualityControlForm } from "./QualityControlForm";
import { BasicGeneralForm } from "./BasicGeneralForm";

const renderResetButton = (resetForm) => {
  return (
    <Button variant="outline" onClick={resetForm}>
      {getLanguageByKey("Reset filter")}
    </Button>
  );
};

export const TicketTabs = ({
  onClose,
  onSubmit,
  loading,
  formIds,
  initialData,
}) => {
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
          <BasicGeneralForm
            data={initialData}
            loading={loading}
            onClose={onClose}
            onSubmit={onSubmit}
            renderFooterButtons={renderResetButton}
            formId={formIds?.generalFormID}
          />
        </Flex>
      </Tabs.Panel>
      <Tabs.Panel pl="lg" value="filter_ticket_info">
        <ScrollArea h="100%">
          <TicketInfoForm
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
                  {getLanguageByKey("Trimite")}
                </Button>
              </>
            )}
            formId={formIds?.ticketInfoFormID}
          />
        </ScrollArea>
      </Tabs.Panel>
      <Tabs.Panel pl="lg" value="filter_contract">
        <ScrollArea h="100%">
          <ContractForm
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
                  {getLanguageByKey("Trimite")}
                </Button>
              </>
            )}
            formId={formIds?.contractFormID}
          />
        </ScrollArea>
      </Tabs.Panel>

      <Tabs.Panel pl="lg" value="filter_invoice">
        <Flex direction="column" justify="space-between" h="100%">
          <InvoiceForm
            data={initialData}
            onSubmit={onSubmit}
            renderFooterButtons={({ onResetForm, formId }) => (
              <>
                {renderResetButton(onResetForm)}

                <Button variant="default" onClick={onClose}>
                  {getLanguageByKey("Închide")}
                </Button>
                <Button loading={loading} type="submit" form={formId}>
                  {getLanguageByKey("Trimite")}
                </Button>
              </>
            )}
            formId={formIds?.invoiceFormID}
          />
        </Flex>
      </Tabs.Panel>

      <Tabs.Panel pl="lg" value="filter_quality_control">
        <Flex direction="column" justify="space-between" h="100%">
          <QualityControlForm
            data={initialData}
            onSubmit={onSubmit}
            renderFooterButtons={({ onResetForm, formId }) => (
              <>
                {renderResetButton(onResetForm)}
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
    </Tabs>
  );
};
