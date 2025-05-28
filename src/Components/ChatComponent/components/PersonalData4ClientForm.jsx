import {
  TextInput,
  Title,
  Box,
  NumberInput,
  ActionIcon,
  Flex,
  Button,
  Group,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { getLanguageByKey } from "../../utils";
import { LuPlus } from "react-icons/lu";
import { api } from "../../../api";
import { showServerError } from "../../utils";
import { enqueueSnackbar } from "notistack";

export const PersonalData4ClientForm = ({ formInstance, data, ticketId }) => {
  const [showSave, setShowSave] = useState(false);

  useEffect(() => {
    if (data && !showSave) {
      formInstance.setValues({
        name: data.name || "",
        surname: data.surname || "",
        phone: data.phone || "",
      });
    }
  }, [data, showSave]);

  const handleAddClient = () => {
    formInstance.setValues({ name: "", surname: "", phone: "" });
    setShowSave(true);
  };

  const handleSaveClient = async () => {
    const values = formInstance.getValues();

    try {
      await api.tickets.ticket.addClientToTicket({
        ticket_id: ticketId,
        name: values.name,
        surname: values.surname,
        phone: values.phone,
      });

      setShowSave(false);
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" });
    }
  };

  const handleCancel = () => {
    setShowSave(false);
    if (data) {
      formInstance.setValues({
        name: data.name || "",
        surname: data.surname || "",
        phone: data.phone || "",
      });
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center">
        <Title order={3}>{getLanguageByKey("Date personale")}</Title>
        <ActionIcon onClick={handleAddClient} variant="filled">
          <LuPlus size={18} />
        </ActionIcon>
      </Flex>

      <TextInput
        mt="md"
        label={getLanguageByKey("Nume")}
        placeholder={getLanguageByKey("Nume")}
        key={formInstance.key("name")}
        {...formInstance.getInputProps("name")}
      />

      <TextInput
        mt="md"
        label={getLanguageByKey("Prenume")}
        placeholder={getLanguageByKey("Prenume")}
        key={formInstance.key("surname")}
        {...formInstance.getInputProps("surname")}
      />

      <NumberInput
        hideControls
        mt="md"
        label={getLanguageByKey("Telefon")}
        placeholder={getLanguageByKey("Telefon")}
        key={formInstance.key("phone")}
        {...formInstance.getInputProps("phone")}
      />

      {showSave && (
        <Group mt="md" grow>
          <Button color="gray" onClick={handleCancel}>
            {getLanguageByKey("Anulează")}
          </Button>
          <Button onClick={handleSaveClient}>
            {getLanguageByKey("Adaugǎ clientul")}
          </Button>
        </Group>
      )}
    </Box>
  );
};
