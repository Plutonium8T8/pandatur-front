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
  open,
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

  const submit = async (values, callback) => {
    if (form.validate().hasErrors) {
      enqueueSnackbar(
        getLanguageByKey("please_complete_required_fields_for_workflow_change"),
        {
          variant: "error",
        },
      );
      return;
    }
    setLoading(true);
    try {
      await api.tickets.updateById({
        id: id ? [id] : selectedTickets,
        ...values,
      });
      onClose(true);
      callback();
      enqueueSnackbar(
        getLanguageByKey("Datele au fost actualizate cu success"),
        {
          variant: "success",
        },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <Tabs h="100%" defaultValue="general_info">
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
          <Text size="sm" c={hasErrorsContractForm ? "red" : "black"}>
            {getLanguageByKey("Contract")}
          </Text>
        </Tabs.Tab>
        <Tabs.Tab value="quality_control">
          <Text size="sm" c={hasErrorQualityControl ? "red" : "black"}>
            {getLanguageByKey("Control calitate")}
          </Text>
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel
        style={{ height: `calc(100% - 42px)` }}
        value="general_info"
        pt="xs"
      >
        <Flex direction="column" justify="space-between" h="100%">
          <GeneralForm
            data={generalInfoLightTicket}
            formInstance={form}
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
          formInstance={form}
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
        <ContractForm
          formInstance={form}
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

      <Tabs.Panel
        style={{ height: `calc(100% - 42px)` }}
        value="quality_control"
      >
        <Flex direction="column" justify="space-between" h="100%">
          <QualityControlForm
            formInstance={form}
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
        </Flex>
      </Tabs.Panel>
    </Tabs>
  );
};
