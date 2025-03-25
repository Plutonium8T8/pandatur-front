import { Select, TextInput, NumberInput, Flex } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useEffect } from "react"
import { getLanguageByKey } from "../../utils"
import { valutaOptions, ibanOptions } from "../../../FormOptions"

const INVOICE_FORM_FILTER_ID = "INVOICE_FORM_FILTER_ID"

export const Invoice = ({ onSubmit, data, renderFooterButtons, formId }) => {
  const idForm = formId || INVOICE_FORM_FILTER_ID

  const form = useForm({
    mode: "uncontrolled"
  })

  useEffect(() => {
    if (data) {
      form.setValues({
        f_serviciu: data?.f_serviciu,
        f_nr_factura: data?.f_nr_factura,
        f_numarul: data?.f_numarul,
        f_pret: data?.f_pret,
        f_suma: data?.f_suma,
        valuta_contului: data?.valuta_contului,
        iban: data?.iban
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
        <TextInput
          label={getLanguageByKey("F/service")}
          placeholder={getLanguageByKey("F/service")}
          key={form.key("f_serviciu")}
          {...form.getInputProps("f_serviciu")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("F/factura")}
          placeholder={getLanguageByKey("F/factura")}
          key={form.key("f_nr_factura")}
          {...form.getInputProps("f_nr_factura")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("F/numarul")}
          placeholder={getLanguageByKey("F/numarul")}
          key={form.key("f_numarul")}
          {...form.getInputProps("f_numarul")}
        />

        <NumberInput
          hideControls
          mt="md"
          label={getLanguageByKey("F/preț")}
          placeholder={getLanguageByKey("F/preț")}
          key={form.key("f_pret")}
          {...form.getInputProps("f_pret")}
        />

        <NumberInput
          mt="md"
          hideControls
          label={getLanguageByKey("F/sumă")}
          placeholder={getLanguageByKey("F/sumă")}
          key={form.key("f_suma")}
          {...form.getInputProps("f_suma")}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Valuta contului")}
          placeholder={getLanguageByKey("Valuta contului")}
          data={valutaOptions}
          clearable
          key={form.key("valuta_contului")}
          {...form.getInputProps("valuta_contului")}
        />

        <Select
          mt="md"
          label="IBAN"
          placeholder="IBAN"
          data={ibanOptions}
          clearable
          key={form.key("iban")}
          {...form.getInputProps("iban")}
        />
      </form>

      <Flex justify="end" gap="md" mt="md">
        {renderFooterButtons?.({ onResetForm: form.reset, formId: idForm })}
      </Flex>
    </>
  )
}
