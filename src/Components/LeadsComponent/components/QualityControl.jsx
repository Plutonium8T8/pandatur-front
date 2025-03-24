import { MultiSelect, Select, TextInput, Flex, Button } from "@mantine/core"
import { useForm } from "@mantine/form"
import { getLanguageByKey } from "../../utils"
import {
  motivulRefuzuluiOptions,
  evaluareOdihnaOptions
} from "../../../FormOptions"

const QUALITY_FORM_FILTER_ID = "QUALITY_FORM_FILTER_ID"

export const QualityControl = ({
  onSubmit,
  data,
  renderFooterButtons,
  onClose,
  loading,
  formId
}) => {
  const idForm = formId || QUALITY_FORM_FILTER_ID

  const form = useForm({
    mode: "uncontrolled"
  })

  return (
    <>
      <form
        id={idForm}
        onSubmit={form.onSubmit((values) =>
          onSubmit(values, () => form.reset())
        )}
      >
        <MultiSelect
          clearable
          searchable
          label={getLanguageByKey("Motivul refuzului")}
          placeholder={getLanguageByKey("Motivul refuzului")}
          data={motivulRefuzuluiOptions}
          key={form.key("motivul_refuzului")}
          {...form.getInputProps("motivul_refuzului")}
        />

        <Select
          mt="md"
          clearable
          searchable
          label={getLanguageByKey("Evaluare odihnă")}
          placeholder={getLanguageByKey("Evaluare odihnă")}
          data={evaluareOdihnaOptions}
          key={form.key("evaluare_de_odihna")}
          {...form.getInputProps("evaluare_de_odihna")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Următoarea vacanță")}
          placeholder={getLanguageByKey("Următoarea vacanță")}
          key={form.key("urmatoarea_vacanta")}
          {...form.getInputProps("urmatoarea_vacanta")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Manager")}
          placeholder={getLanguageByKey("Manager")}
          key={form.key("manager")}
          {...form.getInputProps("manager")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Vacanța")}
          placeholder={getLanguageByKey("Vacanța")}
          key={form.key("vacanta")}
          {...form.getInputProps("vacanta")}
        />
      </form>

      <Flex justify="end" gap="md" mt="md">
        {renderFooterButtons?.(form.reset)}
        <Button variant="default" onClick={onClose}>
          {getLanguageByKey("Închide")}
        </Button>
        <Button loading={loading} type="submit" form={idForm}>
          {getLanguageByKey("Trimite")}
        </Button>
      </Flex>
    </>
  )
}
