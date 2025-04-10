import React, { useState, useEffect } from "react";
import { enqueueSnackbar } from "notistack";
import { Tabs, ScrollArea, Divider, Box, Button, Text } from "@mantine/core";
import { getLanguageByKey, showServerError } from "../utils";
import { PersonalData4ClientForm, Merge, Media } from "./components";
import { api } from "../../api";
import {
  ContractForm,
  QualityControlForm,
  InvoiceForm,
  GeneralForm,
  TicketInfoForm,
} from "../TicketForms";
import { useFormTicket } from "../../hooks";

const ChatExtraInfo = ({
  selectTicketId,
  onUpdatePersonalInfo,
  updatedTicket,
  ticketId,
  mediaFiles,
  selectedUser,
}) => {
  const [extraInfo, setExtraInfo] = useState({});
  const [isLoadingGeneral, setIsLoadingGeneral] = useState(false);
  const [isLoadingPersonalDate, setIsLoadingPersonalDate] = useState(false);
  const [isLoadingCombineLead, setIsLoadingCombineLead] = useState(false);
  const [isLoadingCombineClient, setIsLoadingClient] = useState(false);
  const [isLoadingInfoTicket, setIsLoadingInfoTicket] = useState(false);

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

  const mergeClientsData = async (id) => {
    const ticketOld = selectTicketId;

    setIsLoadingCombineLead(true);
    try {
      await api.tickets.merge({
        ticket_old: ticketOld,
        ticket_new: id,
      });
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
            <Text>{getLanguageByKey("General")}</Text>
          </Tabs.Tab>
          <Tabs.Tab value="info">
            <Box w="100">
              <Text
                c={hasErrorsTicketInfoForm ? "red" : "black"}
                truncate="end"
              >
                {getLanguageByKey("Informații despre tichet")}
              </Text>
            </Box>
          </Tabs.Tab>
          <Tabs.Tab value="contract">
            <Text c={hasErrorsContractForm ? "red" : "black"}>
              {getLanguageByKey("Contract")}
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="invoice">
            <Text>{getLanguageByKey("Invoice")}</Text>
          </Tabs.Tab>
          <Tabs.Tab h="100%" value="media">
            <Text>{getLanguageByKey("Media")}</Text>
          </Tabs.Tab>

          <Tabs.Tab value="quality_control">
            <Text c={hasErrorQualityControl ? "red" : "black"}>
              {getLanguageByKey("Control calitate")}
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
                onUpdatePersonalInfo(values);
              }}
            />

            <Divider my="md" />

            <Merge
              loading={isLoadingCombineLead}
              value={selectedUser.payload?.id}
              onSubmit={(values) => mergeClientsData(values)}
              placeholder={getLanguageByKey("Introduceți ID lead")}
            />

            <Box mt="md">
              <Merge
                loading={isLoadingCombineClient}
                value={ticketId}
                placeholder={getLanguageByKey("Introduceți ID client")}
                onSubmit={(values) => mergeData(values)}
              />
            </Box>
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="info">
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
          <Box p="md" h="100%">
            <Media messages={mediaFiles} />
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
