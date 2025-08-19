import { TextInput, NumberInput, Button, Flex } from "@mantine/core";
import { useField } from "@mantine/form";
import { getLanguageByKey } from "../../utils";

export const Merge = ({
  placeholder,
  value,
  onSubmit,
  loading,
  buttonText,
}) => {
  const field = useField({
    initialValue: "",
    clearErrorOnChange: false,
    validate: (v) => {
      if (typeof v === "string" && v === "") {
        return getLanguageByKey("ID-ul leadului este necesar");
      }
      return null;
    },
  });

  const triggerSubmit = async () => {
    const validateField = await field.validate();
    if (validateField === null) {
      onSubmit(field.getValue(), field.reset);
    }
  };

  return (
    <>
      <TextInput
        disabled
        value={value ?? ""}
        placeholder={getLanguageByKey("Introduceți ID vechi")}
        variant="filled"
        styles={(theme) => ({
          root: { opacity: 1 },
          input: {
            color: theme.black,
            WebkitTextFillColor: theme.black,
            opacity: 1,
            backgroundColor: theme.colors.gray[1],
            fontWeight: 600,
            "::placeholder": { color: theme.colors.gray[7], opacity: 1 },
          },
        })}
      />

      <NumberInput
        hideControls
        mt="md"
        placeholder={placeholder}
        {...field.getInputProps()}
      />

      <Flex justify="end">
        <Button mt="md" onClick={triggerSubmit} loading={loading}>
          {buttonText}
        </Button>
      </Flex>
    </>
  );
};
