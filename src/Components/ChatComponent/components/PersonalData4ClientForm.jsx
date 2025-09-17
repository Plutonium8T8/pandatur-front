import {
  TextInput,
  Title,
  Box,
  ActionIcon,
  Flex,
  Button,
  Group,
  Text,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { getLanguageByKey, showServerError } from "../../utils";
import { LuPlus } from "react-icons/lu";
import { api } from "../../../api";
import { enqueueSnackbar } from "notistack";

export const PersonalData4ClientForm = ({ formInstance, data, ticketId }) => {
  const [showSave, setShowSave] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [emailValue, setEmailValue] = useState("");

  // Диагностика данных (только при изменении data)
  useEffect(() => {
    if (data) {
      console.log("🔍 PersonalData4ClientForm data changed:", { data, ticketId });
    }
  }, [data?.id, ticketId, data]); // Добавили data для линтера

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
      setEmailValue(values.email);
    }
  }, [data?.id, showSave, ticketId, data, formInstance]); // Добавили недостающие зависимости

  const handleAddClient = () => {
    formInstance.setValues({ name: "", surname: "", phone: "", email: "" });
    setPhoneValue("");
    setEmailValue("");
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
      setEmailValue(values.email);
    }
  };

  const handlePhoneChange = (e) => {
    const onlyDigits = e.currentTarget.value.replace(/\D/g, "");
    setPhoneValue(onlyDigits);
    formInstance.setFieldValue("phone", onlyDigits);
  };

  const handleEmailChange = (e) => {
    const value = e.currentTarget.value;
    setEmailValue(value);
    formInstance.setFieldValue("email", value);
  };

  // Показываем заглушку если нет данных
  if (!data) {
    return (
      <Box bg="#f1f3f5" p="md" style={{ borderRadius: 8 }}>
        <Flex justify="space-between" align="center">
          <Title order={3}>{getLanguageByKey("Date personale")}</Title>
          <ActionIcon onClick={handleAddClient} variant="filled">
            <LuPlus size={18} />
          </ActionIcon>
        </Flex>
        <Text mt="md" c="dimmed">
          {getLanguageByKey("Nu sunt date pentru acest client")}
        </Text>
      </Box>
    );
  }

  return (
    <Box bg="#f1f3f5" p="md" style={{ borderRadius: 8 }}>
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
        value={emailValue}
        onChange={handleEmailChange}
        type="email"
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
