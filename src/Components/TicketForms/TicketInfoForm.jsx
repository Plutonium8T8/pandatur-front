import { Select, Flex, NumberInput } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { MdOutlineEuroSymbol } from "react-icons/md"
import { useEffect } from "react"
import { getLanguageByKey, parseServerDate } from "../utils"
import {
  sourceOfLeadOptions,
  promoOptions,
  marketingOptions,
  serviceTypeOptions,
  countryOptions,
  transportOptions,
  nameExcursionOptions,
  purchaseProcessingOptions
} from "../../FormOptions"
import { DD_MM_YYYY } from "../../app-constants"

const TICKET_FORM_FILTER_ID = "TICKET_FORM_FILTER_ID"

export const TicketInfoForm = ({
  onSubmit,
  data,
  hideDisabledInput,
  renderFooterButtons,
  setMinDate,
  formId,
  formInstance
}) => {
  const idForm = formId || TICKET_FORM_FILTER_ID

  useEffect(() => {
    if (data) {
      formInstance.setValues({
        data_venit_in_oficiu: parseServerDate(data.data_venit_in_oficiu),
        data_plecarii: parseServerDate(data.data_plecarii),
        data_intoarcerii: parseServerDate(data.data_intoarcerii),
        data_cererii_de_retur: parseServerDate(data.data_cererii_de_retur),
        buget: data.buget,
        sursa_lead: data.sursa_lead,
        promo: data.promo,
        marketing: data.marketing,
        tipul_serviciului: data.tipul_serviciului,
        tara: data.tara,
        tip_de_transport: data.tip_de_transport,
        denumirea_excursiei_turului: data.denumirea_excursiei_turului,
        procesarea_achizitionarii: data.procesarea_achizitionarii
      })
    }
  }, [data])

  return (
    <>
      <form
        id={idForm}
        onSubmit={formInstance.onSubmit((values) =>
          onSubmit(values, () => formInstance.reset())
        )}
      >
        <NumberInput
          decimalScale={2}
          fixedDecimalScale
          leftSection={<MdOutlineEuroSymbol />}
          hideControls
          label={getLanguageByKey("Vânzare")}
          placeholder={getLanguageByKey("Indicați suma în euro")}
          key={formInstance.key("buget")}
          {...formInstance.getInputProps("buget")}
        />

        <DatePickerInput
          minDate={setMinDate}
          valueFormat={DD_MM_YYYY}
          clearable
          mt="md"
          label={getLanguageByKey("Data venit in oficiu")}
          placeholder={getLanguageByKey("Selectează data venirii în oficiu")}
          key={formInstance.key("data_venit_in_oficiu")}
          {...formInstance.getInputProps("data_venit_in_oficiu")}
        />

        <DatePickerInput
          minDate={setMinDate}
          clearable
          valueFormat={DD_MM_YYYY}
          mt="md"
          label={getLanguageByKey("Data și ora plecării")}
          placeholder={getLanguageByKey("Data și ora plecării")}
          key={formInstance.key("data_plecarii")}
          {...formInstance.getInputProps("data_plecarii")}
        />

        <DatePickerInput
          minDate={setMinDate}
          clearable
          valueFormat={DD_MM_YYYY}
          mt="md"
          label={getLanguageByKey("Data și ora întoarcerii")}
          placeholder={getLanguageByKey("Data și ora întoarcerii")}
          key={formInstance.key("data_intoarcerii")}
          {...formInstance.getInputProps("data_intoarcerii")}
        />

        <DatePickerInput
          minDate={setMinDate}
          clearable
          valueFormat={DD_MM_YYYY}
          mt="md"
          label={getLanguageByKey("Data cererii de retur")}
          placeholder={getLanguageByKey("Data cererii de retur")}
          key={formInstance.key("data_cererii_de_retur")}
          {...formInstance.getInputProps("data_cererii_de_retur")}
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
          key={formInstance.key("sursa_lead")}
          {...formInstance.getInputProps("sursa_lead")}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Promo")}
          placeholder={getLanguageByKey("Promo")}
          data={promoOptions}
          clearable
          key={formInstance.key("promo")}
          {...formInstance.getInputProps("promo")}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Marketing")}
          placeholder={getLanguageByKey("Marketing")}
          data={marketingOptions}
          clearable
          key={formInstance.key("marketing")}
          {...formInstance.getInputProps("marketing")}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Serviciu")}
          placeholder={getLanguageByKey("Serviciu")}
          data={serviceTypeOptions}
          clearable
          key={formInstance.key("tipul_serviciului")}
          {...formInstance.getInputProps("tipul_serviciului")}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Țară")}
          placeholder={getLanguageByKey("Țară")}
          data={countryOptions}
          clearable
          key={formInstance.key("tara")}
          {...formInstance.getInputProps("tara")}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Transport")}
          placeholder={getLanguageByKey("Transport")}
          data={transportOptions}
          clearable
          key={formInstance.key("tip_de_transport")}
          {...formInstance.getInputProps("tip_de_transport")}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Excursie")}
          placeholder={getLanguageByKey("Excursie")}
          data={nameExcursionOptions}
          clearable
          key={formInstance.key("denumirea_excursiei_turului")}
          {...formInstance.getInputProps("denumirea_excursiei_turului")}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Achiziție")}
          placeholder={getLanguageByKey("Achiziție")}
          data={purchaseProcessingOptions}
          clearable
          key={formInstance.key("procesarea_achizitionarii")}
          {...formInstance.getInputProps("procesarea_achizitionarii")}
        />
      </form>

      <Flex justify="end" gap="md" mt="md">
        {renderFooterButtons?.({
          onResetForm: formInstance.reset,
          formId: idForm
        })}
      </Flex>
    </>
  )
}
