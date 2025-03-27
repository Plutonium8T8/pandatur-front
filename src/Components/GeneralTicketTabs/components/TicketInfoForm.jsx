import { Select, Flex, NumberInput } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { getLanguageByKey } from "../../utils"
import {
  sourceOfLeadOptions,
  promoOptions,
  marketingOptions,
  serviceTypeOptions,
  countryOptions,
  transportOptions,
  nameExcursionOptions,
  purchaseProcessingOptions
} from "../../../FormOptions"
import { DD_MM_YYYY, DD_MM_YYYY__HH_mm_ss } from "../../../app-constants"
import dayjs from "dayjs"

const TICKET_FORM_FILTER_ID = "TICKET_FORM_FILTER_ID"

const formatDateOrUndefined = (date) => {
  return date ? dayjs(date).format(DD_MM_YYYY__HH_mm_ss) : undefined
}

export const TicketInfoForm = ({
  onSubmit,
  data,
  hideDisabledInput,
  renderFooterButtons,
  setMinDate,
  formId
}) => {
  const idForm = formId || TICKET_FORM_FILTER_ID

  const form = useForm({
    mode: "uncontrolled",

    transformValues: ({
      data_venit_in_oficiu,
      data_plecarii,
      data_intoarcerii,
      data_cererii_de_retur,
      buget,
      ...rest
    }) => {
      const formattedData = {
        data_plecarii: formatDateOrUndefined(data_plecarii),
        data_venit_in_oficiu_after: formatDateOrUndefined(
          data_venit_in_oficiu?.[0]
        ),
        data_venit_in_oficiu_before: formatDateOrUndefined(
          data_venit_in_oficiu?.[1]
        ),
        data_intoarcerii_after: formatDateOrUndefined(data_intoarcerii?.[0]),
        data_intoarcerii_before: formatDateOrUndefined(data_intoarcerii?.[1]),
        data_cererii_de_retur_after: formatDateOrUndefined(
          data_cererii_de_retur?.[0]
        ),
        data_cererii_de_retur_before: formatDateOrUndefined(
          data_cererii_de_retur?.[1]
        ),
        ...(buget && {
          buget: {
            min: buget,
            max: buget
          }
        })
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
        <NumberInput
          hideControls
          label={`${getLanguageByKey("Vânzare")} €`}
          placeholder={getLanguageByKey("Indicați suma în euro")}
          decimalScale={2}
          fixedDecimalScale
          key={form.key("buget")}
          {...form.getInputProps("buget")}
        />

        <DatePickerInput
          type="range"
          minDate={setMinDate}
          valueFormat={DD_MM_YYYY}
          clearable
          mt="md"
          label={getLanguageByKey("Data venit in oficiu")}
          placeholder={getLanguageByKey("Selectează data venirii în oficiu")}
          key={form.key("data_venit_in_oficiu")}
          {...form.getInputProps("data_venit_in_oficiu")}
        />

        <DatePickerInput
          minDate={setMinDate}
          clearable
          valueFormat={DD_MM_YYYY}
          mt="md"
          label={getLanguageByKey("Data și ora plecării")}
          placeholder={getLanguageByKey("Data și ora plecării")}
          key={form.key("data_plecarii")}
          {...form.getInputProps("data_plecarii")}
        />

        <DatePickerInput
          type="range"
          minDate={setMinDate}
          clearable
          valueFormat={DD_MM_YYYY}
          mt="md"
          label={getLanguageByKey("Data și ora întoarcerii")}
          placeholder={getLanguageByKey("Data și ora întoarcerii")}
          key={form.key("data_intoarcerii")}
          {...form.getInputProps("data_intoarcerii")}
        />

        <DatePickerInput
          type="range"
          minDate={setMinDate}
          clearable
          valueFormat={DD_MM_YYYY}
          mt="md"
          label={getLanguageByKey("Data cererii de retur")}
          placeholder={getLanguageByKey("Data cererii de retur")}
          key={form.key("data_cererii_de_retur")}
          {...form.getInputProps("data_cererii_de_retur")}
        />

        {!hideDisabledInput && (
          <Select
            disabled
            mt="md"
            label={getLanguageByKey("Status sunet telefonic")}
            placeholder={getLanguageByKey("Status sunet telefonic")}
            data={[]}
            clearable
          />
        )}

        <Select
          mt="md"
          label={getLanguageByKey("Sursă lead")}
          placeholder={getLanguageByKey("Sursă lead")}
          data={sourceOfLeadOptions}
          clearable
          key={form.key("sursa_lead")}
          {...form.getInputProps("sursa_lead")}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Promo")}
          placeholder={getLanguageByKey("Promo")}
          data={promoOptions}
          clearable
          key={form.key("promo")}
          {...form.getInputProps("promo")}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Marketing")}
          placeholder={getLanguageByKey("Marketing")}
          data={marketingOptions}
          clearable
          key={form.key("marketing")}
          {...form.getInputProps("marketing")}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Serviciu")}
          placeholder={getLanguageByKey("Serviciu")}
          data={serviceTypeOptions}
          clearable
          key={form.key("tipul_serviciului")}
          {...form.getInputProps("tipul_serviciului")}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Țară")}
          placeholder={getLanguageByKey("Țară")}
          data={countryOptions}
          clearable
          key={form.key("tara")}
          {...form.getInputProps("tara")}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Transport")}
          placeholder={getLanguageByKey("Transport")}
          data={transportOptions}
          clearable
          key={form.key("tip_de_transport")}
          {...form.getInputProps("tip_de_transport")}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Excursie")}
          placeholder={getLanguageByKey("Excursie")}
          data={nameExcursionOptions}
          clearable
          key={form.key("denumirea_excursiei_turului")}
          {...form.getInputProps("denumirea_excursiei_turului")}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Achiziție")}
          placeholder={getLanguageByKey("Achiziție")}
          data={purchaseProcessingOptions}
          clearable
          key={form.key("procesarea_achizitionarii")}
          {...form.getInputProps("procesarea_achizitionarii")}
        />
      </form>

      <Flex justify="end" gap="md" mt="md">
        {renderFooterButtons?.({ onResetForm: form.reset, formId: idForm })}
      </Flex>
    </>
  )
}
