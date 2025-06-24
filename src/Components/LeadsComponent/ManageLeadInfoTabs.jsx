import { Tabs, Flex, Button, Text } from "@mantine/core";
import { useSnackbar } from "notistack";
import { useState, useEffect } from "react";
import { getLanguageByKey, showServerError } from "../utils";
import { api } from "../../api";
import {
  ContractForm,
  GeneralForm,
  TicketInfoForm,
  QualityControlForm,
} from "../TicketForms";
import { useFormTicket } from "../../hooks";

export const ManageLeadInfoTabs = ({
  onClose,
  selectedTickets,
  fetchLeads,
  id,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [ticketInfo, setTicketInfo] = useState();
  const [generalInfoLightTicket, setGeneralInfoLightTicket] = useState();

  const {
    form,
    hasErrorsTicketInfoForm,
    hasErrorsContractForm,
    hasErrorQualityControl,
  } = useFormTicket();

  const handleSubmit = async () => {
    if (form.validate().hasErrors) {
      enqueueSnackbar(
        getLanguageByKey("please_complete_required_fields_for_workflow_change"),
        { variant: "error" }
      );
      return;
    }

    setLoading(true);
    try {
      const values = form.getValues();

      const booleanFields = [
        "contract_trimis",
        "contract_semnat",
        "achitare_efectuata",
        "rezervare_confirmata",
        "contract_arhivat",
        "control",
      ];

      const stringifiedBooleans = Object.fromEntries(
        booleanFields.map((key) => [
          key,
          values[key] !== undefined ? String(values[key]) : undefined,
        ])
      );

      const payload = {
        ...values,
        ...stringifiedBooleans,
      };

      await api.tickets.updateById({
        id: id ? [id] : selectedTickets,
        ...payload,
      });

      onClose(true);

      enqueueSnackbar(
        getLanguageByKey("Datele au fost actualizate cu success"),
        { variant: "success" }
      );

      await fetchLeads();
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getTicketInfo = async (id) => {
      setLoading(true);
      try {
        const lightTicket = await api.tickets.ticket.getLightById(id);
        const ticketInfo = await api.tickets.ticket.getInfo(id);
        setGeneralInfoLightTicket(lightTicket);
        setTicketInfo(ticketInfo);
      } catch (error) {
        enqueueSnackbar(showServerError(error), { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      getTicketInfo(id);
    }
  }, [id]);

  return (
    <Flex direction="column" h="100%">
      <Tabs defaultValue="general_info" style={{ flex: 1 }}>
        <Tabs.List>
          <Tabs.Tab value="general_info">
            <Text size="sm" truncate="end">
              {getLanguageByKey("Informații generale")}
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="ticket_info">
            <Text
              size="sm"
              c={hasErrorsTicketInfoForm ? "red" : "black"}
              truncate="end"
            >
              {getLanguageByKey("Informații despre tichet")}
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="contact">
            <Text
              size="sm"
              c={hasErrorsContractForm ? "red" : "black"}
              truncate="end"
            >
              {getLanguageByKey("Contract")}
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="quality_control">
            <Text
              size="sm"
              c={hasErrorQualityControl ? "red" : "black"}
              truncate="end"
            >
              {getLanguageByKey("Control calitate")}
            </Text>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general_info" pt="xs">
          <GeneralForm data={generalInfoLightTicket} formInstance={form} />
        </Tabs.Panel>

        <Tabs.Panel value="ticket_info" pt="xs">
          <TicketInfoForm formInstance={form} setMinDate={new Date()} data={ticketInfo} />
        </Tabs.Panel>

        <Tabs.Panel value="contact" pt="xs">
          <ContractForm formInstance={form} setMinDate={new Date()} data={ticketInfo} />
        </Tabs.Panel>

        <Tabs.Panel value="quality_control" pt="xs">
          <QualityControlForm formInstance={form} data={ticketInfo} />
        </Tabs.Panel>
      </Tabs>

      <Flex justify="flex-end" gap="sm" p="md" mt="auto">
        <Button variant="default" onClick={onClose}>
          {getLanguageByKey("Închide")}
        </Button>
        <Button loading={loading} onClick={handleSubmit}>
          {getLanguageByKey("Save")}
        </Button>
      </Flex>
    </Flex>
  );
};
