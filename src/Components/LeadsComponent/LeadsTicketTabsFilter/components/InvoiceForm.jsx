import { Select, TextInput, NumberInput, Flex } from "@mantine/core"
import { useForm } from "@mantine/form"
import { getLanguageByKey } from "../../../utils"
import { valutaOptions, ibanOptions } from "../../../../FormOptions"
import { formatNumericValue } from "../utils"

const INVOICE_FORM_FILTER_ID = "INVOICE_FORM_FILTER_ID"

export const InvoiceForm = ({
  onSubmit,
  data,
  renderFooterButtons,
  formId
}) => {
  const idForm = formId || INVOICE_FORM_FILTER_ID

  const form = useForm({
    mode: "uncontrolled",
    transformValues: ({ f_pret, f_suma, ...rest }) => {
      const formattedData = {
        f_pret: formatNumericValue(f_pret),
        f_suma: formatNumericValue(f_suma)
      }

      return { ...formattedData, ...rest }
    }
  })

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
          decimalScale={2}
          fixedDecimalScale
          label={getLanguageByKey("F/preț")}
          placeholder={getLanguageByKey("F/preț")}
          key={form.key("f_pret")}
          {...form.getInputProps("f_pret")}
        />

        <NumberInput
          mt="md"
          decimalScale={2}
          fixedDecimalScale
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
          key={form.key("f_valuta_contului")}
          {...form.getInputProps("f_valuta_contului")}
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
