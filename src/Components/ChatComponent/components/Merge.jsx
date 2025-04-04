import { TextInput, NumberInput, Button, Flex } from "@mantine/core";
import { useField } from "@mantine/form";
import { getLanguageByKey } from "../../utils";

export const Merge = ({ placeholder, value, onSubmit, loading }) => {
  const field = useField({
    initialValue: "",
    clearErrorOnChange: false,
    validate: (value) => {
      if (typeof value === "string" && value === "") {
        return getLanguageByKey("ID-ul leadului este necesar");
      }
      return null;
    },
  });

  const triggerSubmit = async () => {
    const validateField = await field.validate();

    if (validateField === null) {
      onSubmit(field.getValue());
    }
  };

  return (
    <>
      <TextInput
        disabled
        value={value}
        placeholder={getLanguageByKey("Introduceți ID vechi")}
      />

      <NumberInput
        hideControls
        mt="md"
        placeholder={placeholder}
        {...field.getInputProps()}
      />

      <Flex justify="end">
        <Button mt="md" onClick={triggerSubmit} loading={loading}>
          {getLanguageByKey("Combina")}
        </Button>
      </Flex>
    </>
  );
};
