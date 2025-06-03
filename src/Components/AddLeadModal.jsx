import {
  Flex,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  TagsInput,
  Button
} from "@mantine/core";
import { useForm, hasLength } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useContext } from "react";
import { useSnackbar } from "notistack";
import { getLanguageByKey, showServerError } from "@utils";
import { priorityOptions } from "../FormOptions";
import { api } from "@api";
import { useUser } from "@hooks";
import { groupTitleOptions } from "../FormOptions";
import { AppContext } from "../contexts/AppContext";

export const AddLeadModal = ({
  open,
  onClose,
  selectedGroupTitle,
  fetchTickets,
}) => {
  const { userId } = useUser();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, handlers] = useDisclosure(false);
  const { workflowOptions, groupTitleForApi } = useContext(AppContext);

  const form = useForm({
    mode: "uncontrolled",
    validate: {
      name: hasLength({ min: 3 }, getLanguageByKey("mustBeAtLeast3Characters")),
      surname: hasLength({ min: 3 }, getLanguageByKey("mustBeAtLeast3Characters")),
      phone: (value) =>
        value?.toString().trim() === "" || value === undefined
          ? getLanguageByKey("fileIsMandatory")
          : null,
      workflow: (value) =>
        !value ? getLanguageByKey("fileIsMandatory") : null,
    },
  });

  const createTicket = async (values) => {
    handlers.open();
    try {
      await api.tickets.createTickets({ ...values, technician_id: userId });
      form.reset();
      await fetchTickets();
      onClose();
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" });
    } finally {
      handlers.close();
    }
  };

  useEffect(() => {
    if (selectedGroupTitle) {
      form.setFieldValue("group_title", selectedGroupTitle);
    } else {
      form.setFieldValue("group_title", groupTitleForApi);
    }
  }, [selectedGroupTitle, groupTitleForApi]);

  return (

    <form onSubmit={form.onSubmit(createTicket)}>
      <Flex gap="md">
        <TextInput
          withAsterisk
          w="100%"
          label={getLanguageByKey("Nume")}
          placeholder={getLanguageByKey("Nume")}
          key={form.key("name")}
          {...form.getInputProps("name")}
        />
        <TextInput
          withAsterisk
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
          withAsterisk
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
          disabled
          value={form.values.group_title || selectedGroupTitle || groupTitleForApi}
          placeholder={getLanguageByKey("selectGroup")}
          w="100%"
          label={getLanguageByKey("Grup")}
          data={groupTitleOptions}
          key={form.key("group_title")}
          onChange={(value) => form.setFieldValue("group_title", value)}
        />
      </Flex>

      <Flex gap="md">
        <Select
          data={priorityOptions}
          w="100%"
          label={getLanguageByKey("Prioritate")}
          placeholder={getLanguageByKey("Selectează prioritate")}
          key={form.key("priority")}
          {...form.getInputProps("priority")}
          disabled
        />

        <Select
          w="100%"
          label={getLanguageByKey("Workflow")}
          placeholder={getLanguageByKey("Selectează flux de lucru")}
          data={workflowOptions.map((step) => ({ value: step, label: step }))}
          key={form.key("workflow")}
          {...form.getInputProps("workflow")}
        />
      </Flex>

      <TagsInput
        label={getLanguageByKey("tags")}
        placeholder={getLanguageByKey("tags")}
        clearable
        key={form.key("tags")}
        {...form.getInputProps("tags")}
      />

      <Textarea
        autosize
        minRows={4}
        label={getLanguageByKey("Descriere")}
        placeholder={getLanguageByKey("Descriere")}
        key={form.key("description")}
        {...form.getInputProps("description")}
      />

      <Flex justify="end" mt="md" gap="md">
        <Button onClick={onClose} variant="outline">
          {getLanguageByKey("Anulează")}
        </Button>
        <Button loading={loading} type="submit">
          {getLanguageByKey("Creează")}
        </Button>
      </Flex>
    </form>
  );
};
