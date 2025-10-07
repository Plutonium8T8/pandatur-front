import {
  TextInput,
  Title,
  Box,
  ActionIcon,
  Flex,
  Button,
  Group,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { getLanguageByKey, showServerError } from "../../utils";
import { LuPlus } from "react-icons/lu";
import { api } from "../../../api";
import { enqueueSnackbar } from "notistack";

export const PersonalData4ClientForm = ({ formInstance, data, ticketId }) => {
  const [showSave, setShowSave] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");

  useEffect(() => {
    if (data && !showSave) {
      const values = {
        name: data.name || "",
        surname: data.surname || "",
        phone: data.phone || "",
        email: data.email || "",
        ticket_id: ticketId
      };
      formInstance.setValues(values);
      setPhoneValue(values.phone);
    }
  }, [data, showSave]);

  const handleAddClient = () => {
    formInstance.setValues({ name: "", surname: "", phone: "", email: "" });
    setPhoneValue("");
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
        email: values.email,
      });

      setShowSave(false);
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" });
    }
  };

  const handleCancel = () => {
    setShowSave(false);
    if (data) {
      const values = {
        name: data.name || "",
        surname: data.surname || "",
        phone: data.phone || "",
        email: data.email || "",
      };
      formInstance.setValues(values);
      setPhoneValue(values.phone);
    }
  };

  const handlePhoneChange = (e) => {
    const onlyDigits = e.currentTarget.value.replace(/\D/g, "");
    setPhoneValue(onlyDigits);
    formInstance.setFieldValue("phone", onlyDigits);
  };

  return (
    <Box bg="var(--crm-ui-kit-palette-background-primary-disabled)" p="md" style={{ borderRadius: 8 }}>
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

      <TextInput
        mt="md"
        label={getLanguageByKey("Email")}
        placeholder={getLanguageByKey("Email")}
        key={formInstance.key("email")}
        {...formInstance.getInputProps("email")}
      />

      <TextInput
        mt="md"
        label={getLanguageByKey("Telefon")}
        placeholder={getLanguageByKey("Telefon")}
        value={phoneValue}
        onChange={handlePhoneChange}
        inputMode="numeric"
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
