import { TextInput, Select, NumberInput, Flex } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useEffect } from "react";
import { MdOutlineEuroSymbol } from "react-icons/md";
import { getLanguageByKey, parseServerDate } from "../utils";
import { LabelSwitch } from "../LabelSwitch";
import { paymentStatusOptions } from "../../FormOptions";
import { DD_MM_YYYY } from "../../app-constants";
import { useUser } from "../../hooks";

const CONTRACT_FORM_FILTER_ID = "CONTRACT_FORM_FILTER_ID";

export const ContractForm = ({
  onSubmit,
  data,
  hideDisabledInput,
  renderFooterButtons,
  setMinDate,
  formId,
  formInstance,
}) => {
  const idForm = formId || CONTRACT_FORM_FILTER_ID;
  const { hasRole } = useUser();
  const isAdmin = hasRole("ROLE_ADMIN");

  useEffect(() => {
    if (data) {
      formInstance.setValues({
        data_contractului: parseServerDate(data.data_contractului),
        data_avansului: parseServerDate(data.data_avansului),
        data_de_plata_integrala: parseServerDate(data.data_de_plata_integrala),
        numar_de_contract: data.numar_de_contract,
        contract_trimis: data.contract_trimis,
        contract_semnat: data.contract_semnat,
        tour_operator: data.tour_operator,
        numarul_cererii_de_la_operator: data.numarul_cererii_de_la_operator,
        achitare_efectuata: data.achitare_efectuata,
        rezervare_confirmata: data.rezervare_confirmata,
        contract_arhivat: data.contract_arhivat,
        statutul_platii: data.statutul_platii,
        avans_euro: data.avans_euro,
        pret_netto: data.pret_netto,
        achitat_client: data.achitat_client,
        control: data.control,
      });
    }
  }, [data]);

  return (
    <>
      <form
        id={idForm}
        onSubmit={formInstance.onSubmit((values) => {
          onSubmit(values, () => formInstance.reset());
        })}
      >
        <TextInput
          label={getLanguageByKey("Nr de contract")}
          placeholder={getLanguageByKey("Nr de contract")}
          key={formInstance.key("numar_de_contract")}
          {...formInstance.getInputProps("numar_de_contract")}
        />

        <DatePickerInput
          minDate={setMinDate}
          valueFormat={DD_MM_YYYY}
          clearable
          mt="md"
          label={getLanguageByKey("Data contractului")}
          placeholder={getLanguageByKey("Data contractului")}
          key={formInstance.key("data_contractului")}
          {...formInstance.getInputProps("data_contractului")}
        />

        <DatePickerInput
          minDate={setMinDate}
          valueFormat={DD_MM_YYYY}
          clearable
          mt="md"
          label={getLanguageByKey("Data avansului")}
          placeholder={getLanguageByKey("Data avansului")}
          key={formInstance.key("data_avansului")}
          {...formInstance.getInputProps("data_avansului")}
        />

        <DatePickerInput
          minDate={setMinDate}
          valueFormat={DD_MM_YYYY}
          clearable
          mt="md"
          label={getLanguageByKey("Data de plată integrală")}
          placeholder={getLanguageByKey("Data de plată integrală")}
          key={formInstance.key("data_de_plata_integrala")}
          {...formInstance.getInputProps("data_de_plata_integrala")}
        />

        <LabelSwitch
          mt="md"
          label={getLanguageByKey("Contract trimis")}
          key={formInstance.key("contract_trimis")}
          {...formInstance.getInputProps("contract_trimis", {
            type: "checkbox",
          })}
        />

        <LabelSwitch
          mt="md"
          label={getLanguageByKey("Contract semnat")}
          key={formInstance.key("contract_semnat")}
          {...formInstance.getInputProps("contract_semnat", {
            type: "checkbox",
          })}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Operator turistic")}
          placeholder={getLanguageByKey("Operator turistic")}
          key={formInstance.key("tour_operator")}
          {...formInstance.getInputProps("tour_operator")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Nr cererii de la operator")}
          placeholder={getLanguageByKey("Nr cererii de la operator")}
          key={formInstance.key("numarul_cererii_de_la_operator")}
          {...formInstance.getInputProps("numarul_cererii_de_la_operator")}
        />

        <LabelSwitch
          mt="md"
          label={getLanguageByKey("Achitare efectuată")}
          key={formInstance.key("achitare_efectuata")}
          {...formInstance.getInputProps("achitare_efectuata", {
            type: "checkbox",
          })}
        />

        <LabelSwitch
          mt="md"
          label={getLanguageByKey("Rezervare confirmată")}
          key={formInstance.key("rezervare_confirmata")}
          {...formInstance.getInputProps("rezervare_confirmata", {
            type: "checkbox",
          })}
        />

        <LabelSwitch
          mt="md"
          label={getLanguageByKey("Contract arhivat")}
          key={formInstance.key("contract_arhivat")}
          {...formInstance.getInputProps("contract_arhivat", {
            type: "checkbox",
          })}
        />

        <Select
          mt="md"
          label={getLanguageByKey("Plată primită")}
          placeholder={getLanguageByKey("Plată primită")}
          data={paymentStatusOptions}
          clearable
          key={formInstance.key("statutul_platii")}
          {...formInstance.getInputProps("statutul_platii")}
        />

        <NumberInput
          hideControls
          leftSection={<MdOutlineEuroSymbol />}
          mt="md"
          decimalScale={2}
          fixedDecimalScale
          label={getLanguageByKey("Avans euro")}
          placeholder={getLanguageByKey("Avans euro")}
          key={formInstance.key("avans_euro")}
          {...formInstance.getInputProps("avans_euro")}
        />

        <NumberInput
          hideControls
          mt="md"
          decimalScale={2}
          fixedDecimalScale
          leftSection={<MdOutlineEuroSymbol />}
          label={getLanguageByKey("Preț NETTO")}
          placeholder={getLanguageByKey("Preț NETTO")}
          key={formInstance.key("pret_netto")}
          {...formInstance.getInputProps("pret_netto")}
        />

        <NumberInput
          hideControls
          mt="md"
          label={getLanguageByKey("Achitat client")}
          decimalScale={2}
          fixedDecimalScale
          placeholder={getLanguageByKey("Achitat client")}
          key={formInstance.key("achitat_client")}
          {...formInstance.getInputProps("achitat_client")}
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
            decimalScale={2}
            fixedDecimalScale
            mt="md"
            leftSection={<MdOutlineEuroSymbol />}
            label={getLanguageByKey("Comision companie")}
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

        {isAdmin && (
          <LabelSwitch
            mt="md"
            label={getLanguageByKey("Control Admin")}
            key={formInstance.key("control")}
            {...formInstance.getInputProps("control", { type: "checkbox" })}
          />
        )}
      </form>

      <Flex justify="end" gap="md" mt="md">
        {renderFooterButtons?.({
          onResetForm: formInstance.reset,
          formId: idForm,
        })}
      </Flex>
    </>
  );
};
