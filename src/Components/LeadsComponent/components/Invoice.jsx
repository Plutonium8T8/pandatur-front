import { Select, TextInput, NumberInput, Flex, Button } from "@mantine/core"
import { useForm } from "@mantine/form"
import { getLanguageByKey } from "../../utils"
import { valutaOptions, ibanOptions } from "../../../FormOptions"

const INVOICE_FORM_FILTER_ID = "INVOICE_FORM_FILTER_ID"

export const Invoice = ({
  onSubmit,
  data,
  renderFooterButtons,
  onClose,
  loading
}) => {
  const form = useForm({
    mode: "uncontrolled"
  })

  return (
    <>
      <form
        id={INVOICE_FORM_FILTER_ID}
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
        {renderFooterButtons?.(form.reset)}
        <Button variant="default" onClick={onClose}>
          {getLanguageByKey("Închide")}
        </Button>
        <Button loading={loading} type="submit" form={INVOICE_FORM_FILTER_ID}>
          {getLanguageByKey("Trimite")}
        </Button>
      </Flex>
    </>
  )
}
