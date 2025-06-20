import {
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Tabs, Flex, ScrollArea } from "@mantine/core";
import { getLanguageByKey } from "../utils";
import {
  TicketInfoFormFilter,
  ContractFormFilter,
  QualityControlFormFilter,
  BasicGeneralFormFilter,
} from "./components";
import "./TicketFormTabs.css";

const formIds = {
  general: "generalForm",
  ticketInfo: "ticketInfoForm",
  contract: "contractForm",
  invoice: "invoiceForm",
};

export const TicketFormTabs = forwardRef(
  (
    {
      onClose,
      loading,
      initialData,
      orientation = "vertical",
    },
    ref
  ) => {
    const [generalData, setGeneralData] = useState({});
    const [ticketInfoData, setTicketInfoData] = useState({});
    const [contractData, setContractData] = useState({});
    const [qualityData, setQualityData] = useState({});

    useImperativeHandle(ref, () => ({
      getValues: () => ({
        ...generalData,
        ...ticketInfoData,
        ...contractData,
        ...qualityData,
      }),
    }));

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
          <Tabs.Tab value="filter_quality_control">
            {getLanguageByKey("Control calitate")}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="filter_general_info" pl="lg">
          <Flex direction="column" justify="space-between" h="100%">
            <BasicGeneralFormFilter
              data={initialData}
              loading={loading}
              onClose={onClose}
              onSubmit={(values) => setGeneralData(values)}
              formId={formIds.general}
            />
          </Flex>
        </Tabs.Panel>

        <Tabs.Panel value="filter_ticket_info" pl="lg">
          <ScrollArea h="100%">
            <TicketInfoFormFilter
              data={initialData}
              hideDisabledInput
              onSubmit={(values) => setTicketInfoData(values)}
              formId={formIds.ticketInfo}
            />
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="filter_contract" pl="lg">
          <ScrollArea h="100%">
            <ContractFormFilter
              data={initialData}
              hideDisabledInput
              onSubmit={(values) => setContractData(values)}
              formId={formIds.contract}
            />
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="filter_quality_control" pl="lg">
          <Flex direction="column" justify="space-between" h="100%">
            <QualityControlFormFilter
              data={initialData}
              onSubmit={(values) => setQualityData(values)}
            />
          </Flex>
        </Tabs.Panel>
      </Tabs>
    );
  }
);
