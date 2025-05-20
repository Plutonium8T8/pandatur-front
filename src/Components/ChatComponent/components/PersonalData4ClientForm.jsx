import { TextInput, Title, Box, NumberInput } from "@mantine/core";
import { useEffect } from "react";
import { getLanguageByKey } from "../../utils";

export const PersonalData4ClientForm = ({ formInstance, data }) => {
  useEffect(() => {
    if (data) {
      formInstance.setValues({
        name: data.name,
        surname: data.surname,
        phone: data.phone,
      });
    }
  }, [data]);

  return (
    <Box>
      <Title order={3}>{getLanguageByKey("Date personale")}</Title>

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
    </Box>
  );
};
