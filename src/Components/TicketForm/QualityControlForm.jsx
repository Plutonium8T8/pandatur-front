import { MultiSelect, Select, TextInput, Flex } from "@mantine/core"
import { useEffect } from "react"
import { useForm } from "@mantine/form"
import { getLanguageByKey } from "../utils"
import {
  motivulRefuzuluiOptions,
  evaluareOdihnaOptions
} from "../../FormOptions"

const QUALITY_FORM_FILTER_ID = "QUALITY_FORM_FILTER_ID"

export const QualityControlForm = ({
  onSubmit,
  data,
  renderFooterButtons,
  formId,
  isSelect
}) => {
  const idForm = formId || QUALITY_FORM_FILTER_ID

  const CustomSelect = isSelect ? Select : MultiSelect

  const form = useForm({
    mode: "uncontrolled"
  })

  useEffect(() => {
    if (data) {
      form.setValues({
        motivul_refuzului: data.motivul_refuzului,
        evaluare_de_odihna: data.evaluare_de_odihna,
        urmatoarea_vacanta: data.urmatoarea_vacanta,
        manager: data.manager,
        vacanta: data.vacanta
      })
    }
  }, [data])

  return (
    <>
      <form
        id={idForm}
        onSubmit={form.onSubmit((values) =>
          onSubmit(values, () => form.reset())
        )}
      >
        {
          <CustomSelect
            clearable
            searchable
            label={getLanguageByKey("Motivul refuzului")}
            placeholder={getLanguageByKey("Motivul refuzului")}
            data={motivulRefuzuluiOptions}
            key={form.key("motivul_refuzului")}
            {...form.getInputProps("motivul_refuzului")}
          />
        }

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
        {renderFooterButtons?.({ onResetForm: form.reset, formId: idForm })}
      </Flex>
    </>
  )
}
