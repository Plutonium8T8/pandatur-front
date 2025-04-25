import React, { useState, useEffect } from "react";
import { enqueueSnackbar } from "notistack";
import { Tabs, ScrollArea, Divider, Box, Button, Text } from "@mantine/core";
import { getLanguageByKey, showServerError } from "@utils";
import { PersonalData4ClientForm, Merge, Media } from "./components";
import { api } from "@api";
import {
  useFormTicket,
  useApp,
  useFetchTicketChat,
  useMessagesContext,
} from "@hooks";
import {
  ContractForm,
  QualityControlForm,
  InvoiceForm,
  GeneralForm,
  TicketInfoForm,
} from "../TicketForms";

const ChatExtraInfo = ({
  selectTicketId,
  onUpdatePersonalInfo,
  updatedTicket,
  ticketId,
  mediaFiles,
  selectedUser,
  // fetchTicketLight,
}) => {
  const [extraInfo, setExtraInfo] = useState({});
  const [isLoadingGeneral, setIsLoadingGeneral] = useState(false);
  const [isLoadingPersonalDate, setIsLoadingPersonalDate] = useState(false);
  const [isLoadingCombineLead, setIsLoadingCombineLead] = useState(false);
  const [isLoadingCombineClient, setIsLoadingClient] = useState(false);
  const [isLoadingInfoTicket, setIsLoadingInfoTicket] = useState(false);

  const { setTickets } = useApp();
  const { getUserMessages } = useMessagesContext();
  const { getTicket } = useFetchTicketChat(ticketId);

  const {
    form,
    hasErrorsTicketInfoForm,
    hasErrorsContractForm,
    hasErrorQualityControl,
  } = useFormTicket();

  useEffect(() => {
    if (selectTicketId) {
      fetchTicketExtraInfo(selectTicketId);
    }
  }, [selectTicketId]);

  const updateTicketDate = async (values) => {
    if (form.validate().hasErrors) {
      enqueueSnackbar(
        getLanguageByKey("please_complete_required_fields_for_workflow_change"),
        {
          variant: "error",
        },
      );
      return;
    }

    setIsLoadingGeneral(true);
    try {
      await api.tickets.updateById({
        id: [selectTicketId],
        ...values,
      });
      enqueueSnackbar(
        getLanguageByKey("Datele despre ticket au fost create cu succes"),
        {
          variant: "success",
        },
      );
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error",
      });
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  const fetchTicketExtraInfo = async (ticketId) => {
    try {
      const data = await api.tickets.ticket.getInfo(ticketId);

      setExtraInfo(data);
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error",
      });
    }
  };

  const submitPersonalData = async (values) => {
    setIsLoadingPersonalDate(true);
    try {
      await api.users.updateExtended(selectedUser.payload?.id, values);

      enqueueSnackbar(
        getLanguageByKey("Datele despre ticket au fost create cu succes"),
        { variant: "success" },
      );
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error",
      });
    } finally {
      setIsLoadingPersonalDate(false);
    }
  };

  /**
   *
   * @param {number} mergedTicketId
   */
  const fetchTicketLight = async (mergedTicketId) => {
    try {
      await Promise.all([getTicket(), getUserMessages(ticketId)]);
      setTickets((prev) => prev.filter(({ id }) => id !== mergedTicketId));
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    }
  };

  /**
   *
   * @param {number} id
   * @param {() => void} resetField
   */
  const mergeClientsData = async (id, resetField) => {
    const ticketOld = selectTicketId;

    setIsLoadingCombineLead(true);
    try {
      await api.tickets.merge({
        ticket_old: ticketOld,
        ticket_new: id,
      });

      await fetchTicketLight(id);

      resetField();

      enqueueSnackbar(
        getLanguageByKey("Biletele au fost combinate cu succes"),
        {
          variant: "success",
        },
      );
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error",
      });
    } finally {
      setIsLoadingCombineLead(false);
    }
  };

  const mergeData = async (id) => {
    setIsLoadingClient(true);
    try {
      await api.users.clientMerge({
        old_user_id: selectedUser.payload?.id,
        new_user_id: id,
      });

      enqueueSnackbar(
        getLanguageByKey("Utilizatorii au fost combinați cu succes"),
        {
          variant: "success",
        },
      );
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error",
      });
    } finally {
      setIsLoadingClient(false);
    }
  };

  const saveTicketExtraDate = async (values) => {
    setIsLoadingInfoTicket(true);
    try {
      await api.tickets.ticket.create(selectTicketId, values);

      enqueueSnackbar(
        getLanguageByKey("Datele despre ticket au fost create cu succes"),
        { variant: "success" },
      );
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error",
      });
    } finally {
      setIsLoadingInfoTicket(false);
    }
  };

  return (
    <ScrollArea
      maw="35%"
      w="100%"
      h="100%"
      className="chat-extra-info-scroll-area"
    >
      <Tabs defaultValue="general" h="100%">
        <Tabs.List>
          <Tabs.Tab value="general">
            <Text fw={700} size="sm">
              {getLanguageByKey("General")}
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="lead">
            <Text
              fw={700}
              size="sm"
              c={hasErrorsTicketInfoForm ? "red" : "black"}
              truncate="end"
            >
              {getLanguageByKey("lead")}
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="contract">
            <Text
              fw={700}
              size="sm"
              c={hasErrorsContractForm ? "red" : "black"}
            >
              {getLanguageByKey("Contract")}
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="invoice">
            <Text fw={700} size="sm">
              {getLanguageByKey("Invoice")}
            </Text>
          </Tabs.Tab>
          <Tabs.Tab h="100%" value="media">
            <Text fw={700} size="sm">
              {getLanguageByKey("Media")}
            </Text>
          </Tabs.Tab>

          <Tabs.Tab value="quality_control">
            <Text
              fw={700}
              size="sm"
              c={hasErrorQualityControl ? "red" : "black"}
            >
              {getLanguageByKey("quality")}
            </Text>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general">
          <Box p="md">
            <GeneralForm
              data={updatedTicket}
              formInstance={form}
              onSubmit={updateTicketDate}
              renderFooterButtons={({ formId }) => (
                <Button loading={isLoadingGeneral} type="submit" form={formId}>
                  {getLanguageByKey("Actualizare")}
                </Button>
              )}
            />

            <Divider my="md" />

            <PersonalData4ClientForm
              loading={isLoadingPersonalDate}
              data={selectedUser.payload}
              onSubmit={(values) => {
                submitPersonalData(values);
                onUpdatePersonalInfo(selectedUser.payload, values);
              }}
            />

            <Divider my="md" />

            <Merge
              buttonText={getLanguageByKey("combineTickets")}
              loading={isLoadingCombineLead}
              value={ticketId || ""}
              onSubmit={(values, resetField) =>
                mergeClientsData(values, resetField)
              }
              placeholder={getLanguageByKey("Introduceți ID lead")}
            />

            <Box mt="md">
              <Merge
                buttonText={getLanguageByKey("combineClient")}
                loading={isLoadingCombineClient}
                value={selectedUser.payload?.id || ""}
                placeholder={getLanguageByKey("Introduceți ID client")}
                onSubmit={(values) => mergeData(values)}
              />
            </Box>
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="lead">
          <Box p="md">
            <TicketInfoForm
              formInstance={form}
              data={extraInfo}
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
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="contract">
          <Box p="md">
            <ContractForm
              formInstance={form}
              data={extraInfo}
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
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="invoice">
          <Box p="md">
            <InvoiceForm
              data={extraInfo}
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
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="media" h="100%">
          <Box pb="md" pr="md" pl="md" h="100%">
            <Media attachments={mediaFiles} id={selectTicketId} />
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="quality_control">
          <Box p="md">
            <QualityControlForm
              formInstance={form}
              data={extraInfo}
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
          </Box>
        </Tabs.Panel>
      </Tabs>
    </ScrollArea>
  );
};

export default ChatExtraInfo;
