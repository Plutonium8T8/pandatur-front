import { TextInput, Select, NumberInput, Flex } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { MdOutlineEuroSymbol } from "react-icons/md";
import { getLanguageByKey } from "../../utils";
import { LabelSwitch } from "../../LabelSwitch";
import { paymentStatusOptions } from "../../../FormOptions";
import { DD_MM_YYYY } from "../../../app-constants";
import {
  formatDateOrUndefined,
  formatNumericValue,
  convertDateToArray,
  convertNumberRangeToSingleValue,
} from "../../LeadsComponent/utils";

const CONTRACT_FORM_FILTER_ID = "CONTRACT_FORM_FILTER_ID";

const convertStringOrUndefined = (data) => {
  if (typeof data === "boolean") {
    return String(data);
  }
};

export const ContractFormFilter = ({
  onSubmit,
  data,
  hideDisabledInput,
  renderFooterButtons,
  setMinDate,
  formId,
}) => {
  const idForm = formId || CONTRACT_FORM_FILTER_ID;

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
      avans_euro,
      pret_netto,
      achitat_client,
      control,
      numar_de_contract,
      ...rest
    }) => {
      const formattedData = {
        numar_de_contract: numar_de_contract ?? undefined,
        data_contractului: formatDateOrUndefined(data_contractului),
        data_avansului: formatDateOrUndefined(data_avansului),
        data_de_plata_integrala: formatDateOrUndefined(data_de_plata_integrala),
        contract_trimis: convertStringOrUndefined(contract_trimis),
        contract_semnat: convertStringOrUndefined(contract_semnat),
        achitare_efectuata: convertStringOrUndefined(achitare_efectuata),
        rezervare_confirmata: convertStringOrUndefined(rezervare_confirmata),
        contract_arhivat: convertStringOrUndefined(contract_arhivat),
        control: convertStringOrUndefined(control),
        avans_euro: formatNumericValue(avans_euro),
        achitat_client: formatNumericValue(achitat_client),
        pret_netto: formatNumericValue(pret_netto),
      };

      return { ...formattedData, ...rest };
    },
  });

  useEffect(() => {
    if (data) {
      form.setValues({
        data_contractului: convertDateToArray(data.data_contractului),
        data_avansului: convertDateToArray(data.data_avansului),
        data_de_plata_integrala: convertDateToArray(data.data_de_plata_integrala),
        numar_de_contract: data.numar_de_contract,
        contract_trimis: data.contract_trimis,
        contract_semnat: data.contract_semnat,
        tour_operator: data.tour_operator,
        numarul_cererii_de_la_operator: data.numarul_cererii_de_la_operator,
        achitare_efectuata: data.achitare_efectuata,
        rezervare_confirmata: data.rezervare_confirmata,
        contract_arhivat: data.contract_arhivat,
        statutul_platii: data.statutul_platii,
        avans_euro: convertNumberRangeToSingleValue(data.avans_euro),
        pret_netto: convertNumberRangeToSingleValue(data.pret_netto),
        achitat_client: convertNumberRangeToSingleValue(data.achitat_client),
        control: data.control,
      });
    }
  }, [data]);

  return (
    <>
      <form
        id={idForm}
        onSubmit={form.onSubmit((values) => {
          onSubmit(values, () => form.reset());
        })}
      >
        <TextInput
          label={getLanguageByKey("Nr de contract")}
          placeholder={getLanguageByKey("Nr de contract")}
          key={form.key("numar_de_contract")}
          {...form.getInputProps("numar_de_contract")}
        />

        <DatePickerInput
          type="range"
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
          type="range"
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
          type="range"
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
          searchable
        />

        <NumberInput
          hideControls
          mt="md"
          decimalScale={2}
          fixedDecimalScale
          leftSection={<MdOutlineEuroSymbol />}
          label={getLanguageByKey("Avans euro")}
          placeholder={getLanguageByKey("Avans euro")}
          key={form.key("avans_euro")}
          {...form.getInputProps("avans_euro")}
        />

        <NumberInput
          hideControls
          mt="md"
          decimalScale={2}
          fixedDecimalScale
          leftSection={<MdOutlineEuroSymbol />}
          label={getLanguageByKey("Preț NETTO")}
          placeholder={getLanguageByKey("Preț NETTO")}
          key={form.key("pret_netto")}
          {...form.getInputProps("pret_netto")}
        />

        <NumberInput
          hideControls
          mt="md"
          decimalScale={2}
          fixedDecimalScale
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
  );
};
