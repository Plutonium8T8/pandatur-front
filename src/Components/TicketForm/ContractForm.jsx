import { TextInput, Select, NumberInput, Flex } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { useEffect } from "react"
import { getLanguageByKey, formatDate, parseServerDate } from "../utils"
import { LabelSwitch } from "../LabelSwitch"
import { paymentStatusOptions } from "../../FormOptions"
import { DD_MM_YYYY } from "../../app-constants"

const CONTRACT_FORM_FILTER_ID = "CONTRACT_FORM_FILTER_ID"

export const ContractForm = ({
  onSubmit,
  data,
  hideDisabledInput,
  renderFooterButtons,
  setMinDate,
  formId
}) => {
  const idForm = formId || CONTRACT_FORM_FILTER_ID

  const form = useForm({
    mode: "uncontrolled",

    transformValues: ({
      data_contractului,
      data_avansului,
      data_de_plata_integrala,
      contract_trimis,
      contract_semnat,
      achitare_efectuata,
      rezervare_confirmata,
      contract_arhivat,
      control,
      ...rest
    }) => {
      const formattedData = {
        data_contractului: formatDate(data_contractului),
        data_avansului: formatDate(data_avansului),
        data_de_plata_integrala: formatDate(data_de_plata_integrala),
        contract_trimis: String(contract_trimis ?? false),
        contract_semnat: String(contract_semnat ?? false),
        achitare_efectuata: String(achitare_efectuata ?? false),
        rezervare_confirmata: String(rezervare_confirmata ?? false),
        contract_arhivat: String(contract_arhivat ?? false),
        control: String(control ?? false)
      }

      return { ...formattedData, ...rest }
    }
  })

  useEffect(() => {
    if (data) {
      form.setValues({
        data_contractului: parseServerDate(data?.data_contractului),
        data_avansului: parseServerDate(data?.data_avansului),
        data_de_plata_integrala: parseServerDate(data?.data_de_plata_integrala),
        numar_de_contract: data?.numar_de_contract,
        contract_trimis: data?.contract_trimis,
        contract_semnat: data?.contract_semnat,
        tour_operator: data?.tour_operator,
        numarul_cererii_de_la_operator: data?.numarul_cererii_de_la_operator,
        achitare_efectuata: data?.achitare_efectuata,
        rezervare_confirmata: data?.rezervare_confirmata,
        contract_arhivat: data?.contract_arhivat,
        statutul_platii: data?.statutul_platii,
        avans_euro: data?.avans_euro,
        pret_netto: data?.pret_netto,
        achitat_client: data?.achitat_client,
        control: data?.control
      })
    }
  }, [data])

  return (
    <>
      <form
        id={idForm}
        onSubmit={form.onSubmit((values) => {
          onSubmit(values, () => form.reset())
        })}
      >
        <TextInput
          label={getLanguageByKey("Nr de contract")}
          placeholder={getLanguageByKey("Nr de contract")}
          key={form.key("numar_de_contract")}
          {...form.getInputProps("numar_de_contract")}
        />
        <DatePickerInput
          minDate={setMinDate}
          valueFormat={DD_MM_YYYY}
          clearable
          mt="md"
          label={getLanguageByKey("Data contractului")}
          placeholder={getLanguageByKey("Data contractului")}
          key={form.key("data_contractului")}
          {...form.getInputProps("data_contractului")}
        />

        <DatePickerInput
          minDate={setMinDate}
          valueFormat={DD_MM_YYYY}
          clearable
          mt="md"
          label={getLanguageByKey("Data avansului")}
          placeholder={getLanguageByKey("Data avansului")}
          key={form.key("data_avansului")}
          {...form.getInputProps("data_avansului")}
        />

        <DatePickerInput
          minDate={setMinDate}
          valueFormat={DD_MM_YYYY}
          clearable
          mt="md"
          label={getLanguageByKey("Data de plată integrală")}
          placeholder={getLanguageByKey("Data de plată integrală")}
          key={form.key("data_de_plata_integrala")}
          {...form.getInputProps("data_de_plata_integrala")}
        />

        <LabelSwitch
          mt="md"
          label={getLanguageByKey("Contract trimis")}
          key={form.key("contract_trimis")}
          {...form.getInputProps("contract_trimis", { type: "checkbox" })}
        />

        <LabelSwitch
          mt="md"
          label={getLanguageByKey("Contract semnat")}
          key={form.key("contract_semnat")}
          {...form.getInputProps("contract_semnat", { type: "checkbox" })}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Operator turistic")}
          placeholder={getLanguageByKey("Operator turistic")}
          key={form.key("tour_operator")}
          {...form.getInputProps("tour_operator")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Nr cererii de la operator")}
          placeholder={getLanguageByKey("Nr cererii de la operator")}
          key={form.key("numarul_cererii_de_la_operator")}
          {...form.getInputProps("numarul_cererii_de_la_operator")}
        />

        <LabelSwitch
          mt="md"
          label={getLanguageByKey("Achitare efectuată")}
          key={form.key("achitare_efectuata")}
          {...form.getInputProps("achitare_efectuata", { type: "checkbox" })}
        />

        <LabelSwitch
          mt="md"
          label={getLanguageByKey("Rezervare confirmată")}
          key={form.key("rezervare_confirmata")}
          {...form.getInputProps("rezervare_confirmata", { type: "checkbox" })}
        />

        <LabelSwitch
          mt="md"
          label={getLanguageByKey("Contract arhivat")}
          key={form.key("contract_arhivat")}
          {...form.getInputProps("contract_arhivat", { type: "checkbox" })}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Plată primită")}
          placeholder={getLanguageByKey("Plată primită")}
          data={paymentStatusOptions}
          clearable
          key={form.key("statutul_platii")}
          {...form.getInputProps("statutul_platii")}
        />

        <NumberInput
          hideControls
          mt="md"
          label={`${getLanguageByKey("Avans euro")} €`}
          placeholder={`${getLanguageByKey("Avans euro")} €`}
          key={form.key("avans_euro")}
          {...form.getInputProps("avans_euro")}
        />

        <NumberInput
          hideControls
          mt="md"
          label={`${getLanguageByKey("Preț NETTO")} €`}
          placeholder={`${getLanguageByKey("Preț NETTO")} €`}
          key={form.key("pret_netto")}
          {...form.getInputProps("pret_netto")}
        />

        <NumberInput
          hideControls
          mt="md"
          label={getLanguageByKey("Achitat client")}
          placeholder={getLanguageByKey("Achitat client")}
          key={form.key("achitat_client")}
          {...form.getInputProps("achitat_client")}
        />

        {!hideDisabledInput && (
          <NumberInput
            disabled
            hideControls
            mt="md"
            label={getLanguageByKey("Restanță client")}
            placeholder={getLanguageByKey("Restanță client")}
          />
        )}

        {!hideDisabledInput && (
          <NumberInput
            disabled
            hideControls
            mt="md"
            label={`${getLanguageByKey("Comision companie")} €`}
            placeholder={`${getLanguageByKey("Comision companie")} €`}
          />
        )}

        {!hideDisabledInput && (
          <TextInput
            disabled
            mt="md"
            label={getLanguageByKey("Statut achitare")}
            placeholder={getLanguageByKey("Statut achitare")}
          />
        )}

        <LabelSwitch
          mt="md"
          label={getLanguageByKey("Control Admin")}
          key={form.key("control")}
          {...form.getInputProps("control", { type: "checkbox" })}
        />
      </form>

      <Flex justify="end" gap="md" mt="md">
        {renderFooterButtons?.({ onResetForm: form.reset, formId: idForm })}
      </Flex>
    </>
  )
}
