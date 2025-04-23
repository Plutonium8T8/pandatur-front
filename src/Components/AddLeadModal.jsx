import {
  Flex,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  TagsInput,
  Button,
} from "@mantine/core";
import { useForm, hasLength, isEmail } from "@mantine/form";
import { MantineModal } from "../Components";
import { getLanguageByKey } from "./utils";
import { priorityOptions, workflowOptions } from "../FormOptions";

const checkPhoneNumber = (value) => {
  if (value) {
    const convertToString = value.toString();
    if (!convertToString.startsWith("6") && !convertToString.startsWith("7")) {
      return getLanguageByKey("numberMustStartWith6Or7");
    }

    if (convertToString.length !== 8) {
      return getLanguageByKey("numberMustContain8Characters");
    }
  }
};

export const AddLeadModal = ({ open, onClose }) => {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      email: "",
      termsOfService: false,
    },

    validate: {
      name: hasLength({ min: 3 }, getLanguageByKey("mustBeAtLeast3Characters")),
      surname: hasLength(
        { min: 3 },
        getLanguageByKey("mustBeAtLeast3Characters"),
      ),
      email: isEmail(getLanguageByKey("invalidEmail")),
      phone: checkPhoneNumber,
    },
  });
  return (
    <MantineModal
      open={open}
      onClose={onClose}
      title={getLanguageByKey("Lead nou")}
    >
      <form onSubmit={form.onSubmit((values) => console.log(values))}>
        <Flex gap="md">
          <TextInput
            w="100%"
            label={getLanguageByKey("Nume")}
            placeholder={getLanguageByKey("Nume")}
            key={form.key("name")}
            {...form.getInputProps("name")}
          />
          <TextInput
            w="100%"
            label={getLanguageByKey("Prenume")}
            placeholder={getLanguageByKey("Prenume")}
            key={form.key("surname")}
            {...form.getInputProps("surname")}
          />
        </Flex>

        <Flex gap="md">
          <TextInput
            type="email"
            w="100%"
            label={getLanguageByKey("Email")}
            placeholder={getLanguageByKey("Email")}
            key={form.key("email")}
            {...form.getInputProps("email")}
          />
          <NumberInput
            hideControls
            w="100%"
            label={getLanguageByKey("Telefon")}
            placeholder={getLanguageByKey("Telefon")}
            key={form.key("phone")}
            {...form.getInputProps("phone")}
          />
        </Flex>
        <Flex gap="md">
          <TextInput
            w="100%"
            label={getLanguageByKey("Contact")}
            placeholder={getLanguageByKey("Contact")}
            key={form.key("contact")}
            {...form.getInputProps("contact")}
          />
          <Select
            placeholder={getLanguageByKey("Grup")}
            w="100%"
            label={getLanguageByKey("Grup")}
            data={[
              { value: "RO", label: "RO" },
              { value: "MD", label: "MD" },
              { value: "Filiale", label: getLanguageByKey("FIL") },
              { value: "Francize", label: getLanguageByKey("FRA") },
            ]}
          />
        </Flex>
        <Flex gap="md">
          <Select
            data={priorityOptions}
            w="100%"
            label={getLanguageByKey("Prioritate")}
            placeholder={getLanguageByKey("Prioritate")}
            key={form.key("priority")}
            {...form.getInputProps("priority")}
          />

          <Select
            w="100%"
            label={getLanguageByKey("Workflow")}
            placeholder={getLanguageByKey(
              "Alege workflow pentru afisare in sistem",
            )}
            data={workflowOptions}
          />
        </Flex>

        <TagsInput
          label={getLanguageByKey("tags")}
          placeholder={getLanguageByKey("tags")}
        />

        <Textarea
          autosize
          minRows={4}
          clearable
          label={getLanguageByKey("Descriere")}
          placeholder={getLanguageByKey("Descriere")}
        />

        <Flex justify="end" mt="md" gap="md">
          <Button type="submit" variant="outline">
            {getLanguageByKey("Anulează")}
          </Button>
          <Button type="submit">{getLanguageByKey("Creează")}</Button>
        </Flex>
      </form>
    </MantineModal>
  );
};
