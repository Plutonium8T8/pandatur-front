import { Select, Button, Flex, NumberInput } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { useEffect } from "react"
import { getLanguageByKey, formatDate, parseServerDate } from "../../utils"
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
import { DD_MM_YYYY } from "../../../app-constants"

export const TicketInfoForm = ({ onClose, onSubmit, loading, data }) => {
  const form = useForm({
    mode: "uncontrolled",

    transformValues: ({
      data_venit_in_oficiu,
      data_plecarii,
      data_intoarcerii,
      data_cererii_de_retur,
      ...rest
    }) => {
      const formattedData = {
        data_venit_in_oficiu: formatDate(data_venit_in_oficiu),
        data_plecarii: formatDate(data_plecarii),
        data_intoarcerii: formatDate(data_intoarcerii),
        data_cererii_de_retur: formatDate(data_cererii_de_retur)
      }

      return { ...formattedData, ...rest }
    }
  })

  useEffect(() => {
    if (data) {
      console.log("🚀 ~ useEffect ~ data:", data)
      form.setValues({
        data_venit_in_oficiu: parseServerDate(data?.data_venit_in_oficiu),
        data_plecarii: parseServerDate(data?.data_plecarii),
        data_intoarcerii: parseServerDate(data?.data_intoarcerii),
        data_cererii_de_retur: parseServerDate(data?.data_cererii_de_retur),
        buget: data?.buget,
        sursa_lead: data?.sursa_lead,
        promo: data?.promo,
        marketing: data?.marketing,
        tipul_serviciului: data?.tipul_serviciului,
        tara: data?.tara,
        tip_de_transport: data?.tip_de_transport,
        denumirea_excursiei_turului: data?.denumirea_excursiei_turului,
        procesarea_achizitionarii: data?.procesarea_achizitionarii
      })
    }
  }, [data])

  return (
    <form
      onSubmit={form.onSubmit((values) => onSubmit(values, () => form.reset()))}
    >
      <NumberInput
        hideControls
        label={`${getLanguageByKey("Vânzare")} €`}
        placeholder={getLanguageByKey("Indicați suma în euro")}
        key={form.key("buget")}
        {...form.getInputProps("buget")}
      />

      <DatePickerInput
        minDate={new Date()}
        valueFormat={DD_MM_YYYY}
        clearable
        mt="md"
        label={getLanguageByKey("Data venit in oficiu")}
        placeholder={getLanguageByKey("Selectează data venirii în oficiu")}
        key={form.key("data_venit_in_oficiu")}
        {...form.getInputProps("data_venit_in_oficiu")}
      />

      <DatePickerInput
        minDate={new Date()}
        clearable
        valueFormat={DD_MM_YYYY}
        mt="md"
        label={getLanguageByKey("Data și ora plecării")}
        placeholder={getLanguageByKey("Data și ora plecării")}
        key={form.key("data_plecarii")}
        {...form.getInputProps("data_plecarii")}
      />
      <DatePickerInput
        minDate={new Date()}
        clearable
        valueFormat={DD_MM_YYYY}
        mt="md"
        label={getLanguageByKey("Data și ora întoarcerii")}
        placeholder={getLanguageByKey("Data și ora întoarcerii")}
        key={form.key("data_intoarcerii")}
        {...form.getInputProps("data_intoarcerii")}
      />

      <DatePickerInput
        minDate={new Date()}
        clearable
        valueFormat={DD_MM_YYYY}
        mt="md"
        label={getLanguageByKey("Data cererii de retur")}
        placeholder={getLanguageByKey("Data cererii de retur")}
        key={form.key("data_cererii_de_retur")}
        {...form.getInputProps("data_cererii_de_retur")}
      />

      <Select
        disabled
        mt="md"
        label={getLanguageByKey("Status sunet telefonic")}
        placeholder={getLanguageByKey("Status sunet telefonic")}
        data={[]}
        clearable
      />

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

      <Flex justify="end" gap="md" mt="md">
        <Button variant="default" onClick={() => onClose()}>
          {getLanguageByKey("Închide")}
        </Button>
        <Button loading={loading} type="submit">
          {getLanguageByKey("Trimite")}
        </Button>
      </Flex>
    </form>
  )
}
