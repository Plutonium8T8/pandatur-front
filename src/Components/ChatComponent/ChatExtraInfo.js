import React, { useState, useEffect } from "react";
import { enqueueSnackbar } from "notistack";
import {
  Tabs,
  ScrollArea,
  Divider,
  Box,
  Button,
  Text,
  Flex,
  Loader,
} from "@mantine/core";
import { getLanguageByKey, showServerError } from "@utils";
import { api } from "../../api";
import {
  useFormTicket,
  useApp,
  useFetchTicketChat,
  useMessagesContext,
} from "@hooks";
import { PersonalData4ClientForm, Merge, Media } from "./components";
import {
  ContractForm,
  QualityControlForm,
  GeneralForm,
  TicketInfoForm,
} from "../TicketForms";
import { InvoiceTab } from "./components";

const ChatExtraInfo = ({
  selectTicketId,
  onUpdatePersonalInfo,
  updatedTicket,
  ticketId,
  selectedUser,
}) => {
  const [extraInfo, setExtraInfo] = useState({});
  const [isLoadingExtraInfo, setIsLoadingExtraInfo] = useState(true);
  const [isLoadingGeneral, setIsLoadingGeneral] = useState(false);
  const [isLoadingCombineLead, setIsLoadingCombineLead] = useState(false);
  const [isLoadingCombineClient, setIsLoadingClient] = useState(false);
  const [isLoadingInfoTicket, setIsLoadingInfoTicket] = useState(false);

  const { setTickets } = useApp();
  const { getUserMessages, mediaFiles } = useMessagesContext();
  const { getTicket } = useFetchTicketChat(ticketId);

  const {
    form,
    hasErrorsTicketInfoForm,
    hasErrorsContractForm,
    hasErrorQualityControl,
  } = useFormTicket();

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
        id: [ticketId],
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
      setIsLoadingExtraInfo(true);
      const data = await api.tickets.ticket.getInfo(ticketId);

      setExtraInfo(data);
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setIsLoadingExtraInfo(false);
    }
  };

  /**
   *
   * @param {number} id
   * @param {() => void} resetField
   */
  const mergeClientsData = async (id, resetField) => {
    const ticketOld = ticketId;

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

  const saveTicketExtraDate = async (type, values) => {
    setIsLoadingInfoTicket(true);
    try {
      await api.tickets.ticket.create(type, values);
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

  useEffect(() => {
    if (ticketId) {
      fetchTicketExtraInfo(ticketId);
    }
  }, [ticketId]);

  const handleSubmitAllForms = async () => {
    const values = form.getValues();

    if (form.validate().hasErrors) {
      enqueueSnackbar(
        getLanguageByKey("please_complete_required_fields_for_workflow_change"),
        { variant: "error" }
      );
      return;
    }

    const generalFields = {
      technician_id: values.technician_id,
      workflow: values.workflow,
      priority: values.priority,
      contact: values.contact,
      tags: values.tags,
      group_title: values.group_title,
      description: values.description,
    };

    const {
      technician_id,
      workflow,
      priority,
      contact,
      tags,
      group_title,
      description,
      name,
      surname,
      phone,
      email,
      ...extraFields
    } = values;

    try {
      setIsLoadingGeneral(true);

      await api.tickets.updateById({
        id: [ticketId],
        ...generalFields,
      });

      await api.users.updateExtended(selectedUser.payload?.id, {
        name,
        surname,
        phone,
        email
      });

      await api.tickets.ticket.create(ticketId, extraFields);

      enqueueSnackbar(
        getLanguageByKey("Datele despre ticket au fost create cu succes"),
        { variant: "success" }
      );
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  if (isLoadingExtraInfo) {
    return (
      <Flex h="100%" justify="center" align="center" maw="35%" w="100%" className="chat-extra-info-scroll-area">
        <Loader />
      </Flex>
    );
  }

  return (
    <ScrollArea maw="35%" w="100%" h="100%" className="chat-extra-info-scroll-area">
      <Tabs defaultValue="general" h="100%">
        <Box
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            backgroundColor: "white",
          }}
          p="md"
        >
          <Tabs.List>
            <Tabs.Tab value="general">
              <Text fw={900} size="sm">
                {getLanguageByKey("General")}
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="lead">
              <Text
                fw={900}
                size="sm"
                c={hasErrorsTicketInfoForm ? "red" : "black"}
                truncate="end"
              >
                {getLanguageByKey("lead")}
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="contract">
              <Text
                fw={900}
                size="sm"
                c={hasErrorsContractForm ? "red" : "black"}
              >
                {getLanguageByKey("Contract")}
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="documents">
              <Text fw={900} size="sm">
                {getLanguageByKey("documents")}
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="media">
              <Text fw={900} size="sm">
                {getLanguageByKey("Media")}
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="quality_control">
              <Text
                fw={900}
                size="sm"
                c={hasErrorQualityControl ? "red" : "black"}
              >
                {getLanguageByKey("quality")}
              </Text>
            </Tabs.Tab>
          </Tabs.List>

          <Button
            fullWidth
            mt="md"
            loading={isLoadingGeneral || isLoadingInfoTicket}
            onClick={handleSubmitAllForms}
          >
            {getLanguageByKey("Actualizare")}
          </Button>
        </Box>

        <Tabs.Panel value="general">
          <Box p="md">
            <GeneralForm
              data={updatedTicket}
              formInstance={form}
              onSubmit={updateTicketDate}
            />

            <Divider my="md" size="md" color="green" />

            <PersonalData4ClientForm
              formInstance={form}
              data={selectedUser.payload}
              ticketId={ticketId}
            />

            <Divider my="md" size="md" color="green" />

            <Box mt="md" bg="#e9ecef" p="md" style={{ borderRadius: 8 }}>
              <Merge
                buttonText={getLanguageByKey("combineTickets")}
                loading={isLoadingCombineLead}
                value={ticketId || ""}
                onSubmit={(values, resetField) =>
                  mergeClientsData(values, resetField)
                }
                placeholder={getLanguageByKey("Introduceți ID lead")}
              />
            </Box>

            <Box mt="md" bg="#e9ecef" p="md" style={{ borderRadius: 8 }}>
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
            />
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="contract">
          <Box p="md">
            <ContractForm
              formInstance={form}
              data={extraInfo}
              onSubmit={(values) => saveTicketExtraDate(values)}
            />
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="documents">
          <Box p="md">
            <InvoiceTab extraInfo={extraInfo} clientInfo={selectedUser.payload} />
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="media" h="100%">
          <Box pb="md" pr="md" pl="md" h="100%">
            <Media messages={mediaFiles} id={ticketId} />
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="quality_control">
          <Box p="md">
            <QualityControlForm
              formInstance={form}
              data={extraInfo}
              onSubmit={(values) => saveTicketExtraDate(values)}
            />
          </Box>
        </Tabs.Panel>
      </Tabs>
    </ScrollArea >
  );
};

export default ChatExtraInfo;
