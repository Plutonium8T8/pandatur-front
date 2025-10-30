import {
  TextInput,
  Select,
  NumberInput,
  Flex,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import {
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { MdOutlineEuroSymbol } from "react-icons/md";
import dayjs from "dayjs";
import { getLanguageByKey } from "../../utils";
import { LabelSwitch } from "../../LabelSwitch";
import { paymentStatusOptions } from "../../../FormOptions";
import { YYYY_MM_DD } from "../../../app-constants";
import {
  formatDateOrUndefinedFilter,
  formatNumericValue,
  convertDateToArrayFilter,
  convertNumberRangeToSingleValue,
} from "../../LeadsComponent/utils";

const CONTRACT_FORM_FILTER_ID = "CONTRACT_FORM_FILTER_ID";

const convertBooleanOrUndefined = (value) => {
  if (typeof value === "boolean") return value;
  return undefined;
};

export const ContractFormFilter = forwardRef(
  (
    {
      data,
      hideDisabledInput,
      renderFooterButtons,
      setMinDate,
      formId,
    },
    ref
  ) => {
    const idForm = formId || CONTRACT_FORM_FILTER_ID;

    const form = useForm({
      mode: "controlled",
      initialValues: {
        numar_de_contract: "",
        data_contractului: [],
        data_avansului: [],
        data_de_plata_integrala: [],
        contract_trimis: undefined,
        contract_semnat: undefined,
        tour_operator: "",
        numarul_cererii_de_la_operator: "",
        achitare_efectuata: undefined,
        rezervare_confirmata: undefined,
        contract_arhivat: undefined,
        statutul_platii: null,
        avans_euro: null,
        pret_netto: null,
        achitat_client: null,
        control: undefined,
      },
      transformValues: (values) => {
        const transformed = {
          numar_de_contract: values.numar_de_contract || undefined,
          data_contractului: formatDateOrUndefinedFilter(values.data_contractului),
          data_avansului: formatDateOrUndefinedFilter(values.data_avansului),
          data_de_plata_integrala: formatDateOrUndefinedFilter(values.data_de_plata_integrala),
          contract_trimis: convertBooleanOrUndefined(values.contract_trimis),
          contract_semnat: convertBooleanOrUndefined(values.contract_semnat),
          tour_operator: values.tour_operator || undefined,
          numarul_cererii_de_la_operator: values.numarul_cererii_de_la_operator || undefined,
          achitare_efectuata: convertBooleanOrUndefined(values.achitare_efectuata),
          rezervare_confirmata: convertBooleanOrUndefined(values.rezervare_confirmata),
          contract_arhivat: convertBooleanOrUndefined(values.contract_arhivat),
          statutul_platii: values.statutul_platii || undefined,
          avans_euro: formatNumericValue(values.avans_euro),
          pret_netto: formatNumericValue(values.pret_netto),
          achitat_client: formatNumericValue(values.achitat_client),
          control: convertBooleanOrUndefined(values.control),
        };

        return Object.fromEntries(
          Object.entries(transformed).filter(
            ([_, v]) => v !== undefined && v !== null && v !== ""
          )
        );
      },
    });

    useEffect(() => {
      if (data) {
        form.setValues({
          data_contractului: convertDateToArrayFilter(data.data_contractului),
          data_avansului: convertDateToArrayFilter(data.data_avansului),
          data_de_plata_integrala: convertDateToArrayFilter(data.data_de_plata_integrala),
          numar_de_contract: data.numar_de_contract || "",
          contract_trimis: data.contract_trimis ?? undefined,
          contract_semnat: data.contract_semnat ?? undefined,
          tour_operator: data.tour_operator || "",
          numarul_cererii_de_la_operator: data.numarul_cererii_de_la_operator || "",
          achitare_efectuata: data.achitare_efectuata ?? undefined,
          rezervare_confirmata: data.rezervare_confirmata ?? undefined,
          contract_arhivat: data.contract_arhivat ?? undefined,
          statutul_platii: data.statutul_platii || null,
          avans_euro: convertNumberRangeToSingleValue(data.avans_euro),
          pret_netto: convertNumberRangeToSingleValue(data.pret_netto),
          achitat_client: convertNumberRangeToSingleValue(data.achitat_client),
          control: data.control ?? undefined,
        });
      }
    }, [data]);

    useImperativeHandle(ref, () => ({
      getValues: () => form.getTransformedValues(),
    }));

    const getDayPropsWithHighlight = (date) => {
      const isToday = dayjs(date).isSame(dayjs(), 'day');
      return {
        style: isToday ? {
          backgroundColor: 'var(--mantine-color-blue-1)',
          fontWeight: 700,
          border: '2px solid var(--mantine-color-blue-6)',
          borderRadius: '50%',
        } : undefined,
      };
    };

    return (
      <>
        <form id={idForm}>
          <TextInput
            label={getLanguageByKey("Nr de contract")}
            placeholder={getLanguageByKey("Nr de contract")}
            {...form.getInputProps("numar_de_contract")}
          />

          <DatePickerInput
            type="range"
            minDate={setMinDate}
            valueFormat={YYYY_MM_DD}
            clearable
            mt="md"
            label={getLanguageByKey("Data contractului")}
            placeholder={getLanguageByKey("Data contractului")}
            getDayProps={getDayPropsWithHighlight}
            {...form.getInputProps("data_contractului")}
          />

          <DatePickerInput
            type="range"
            minDate={setMinDate}
            valueFormat={YYYY_MM_DD}
            clearable
            mt="md"
            label={getLanguageByKey("Data avansului")}
            placeholder={getLanguageByKey("Data avansului")}
            getDayProps={getDayPropsWithHighlight}
            {...form.getInputProps("data_avansului")}
          />

          <DatePickerInput
            type="range"
            minDate={setMinDate}
            valueFormat={YYYY_MM_DD}
            clearable
            mt="md"
            label={getLanguageByKey("Data de plată integrală")}
            placeholder={getLanguageByKey("Data de plată integrală")}
            getDayProps={getDayPropsWithHighlight}
            {...form.getInputProps("data_de_plata_integrala")}
          />

          <LabelSwitch
            mt="md"
            color="var(--crm-ui-kit-palette-link-primary)"
            label={getLanguageByKey("Contract trimis")}
            {...form.getInputProps("contract_trimis", { type: "checkbox" })}
          />

          <LabelSwitch
            mt="md"
            color="var(--crm-ui-kit-palette-link-primary)"
            label={getLanguageByKey("Contract semnat")}
            {...form.getInputProps("contract_semnat", { type: "checkbox" })}
          />

          <TextInput
            mt="md"
            label={getLanguageByKey("Operator turistic")}
            placeholder={getLanguageByKey("Operator turistic")}

            {...form.getInputProps("tour_operator")}
          />

          <TextInput
            mt="md"
            label={getLanguageByKey("Nr cererii de la operator")}
            placeholder={getLanguageByKey("Nr cererii de la operator")}

            {...form.getInputProps("numarul_cererii_de_la_operator")}
          />

          <LabelSwitch
            mt="md"
            color="var(--crm-ui-kit-palette-link-primary)"
            label={getLanguageByKey("Achitare efectuată")}
            {...form.getInputProps("achitare_efectuata", { type: "checkbox" })}
          />

          <LabelSwitch
            mt="md"
            color="var(--crm-ui-kit-palette-link-primary)"
            label={getLanguageByKey("Rezervare confirmată")}
            {...form.getInputProps("rezervare_confirmata", { type: "checkbox" })}
          />

          <LabelSwitch
            mt="md"
            color="var(--crm-ui-kit-palette-link-primary)"
            label={getLanguageByKey("Contract arhivat")}
            {...form.getInputProps("contract_arhivat", { type: "checkbox" })}
          />

          <Select
            mt="md"
            label={getLanguageByKey("Plată primită")}
            placeholder={getLanguageByKey("Plată primită")}

            data={paymentStatusOptions}
            clearable
            searchable
            {...form.getInputProps("statutul_platii")}
          />

          <NumberInput
            hideControls
            mt="md"
            decimalScale={2}
            fixedDecimalScale
            leftSection={<MdOutlineEuroSymbol />}
            label={getLanguageByKey("Avans euro")}
            placeholder={getLanguageByKey("Avans euro")}
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

            {...form.getInputProps("pret_netto")}
          />

          <NumberInput
            hideControls
            mt="md"
            decimalScale={2}
            fixedDecimalScale
            label={getLanguageByKey("Achitat client")}
            placeholder={getLanguageByKey("Achitat client")}

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
            />
          )}

          {!hideDisabledInput && (
            <TextInput
              disabled
              mt="md"
              label={getLanguageByKey("Statut achitare")}
            />
          )}

          <LabelSwitch
            mt="md"
            color="var(--crm-ui-kit-palette-link-primary)"
            label={getLanguageByKey("Control Admin")}
            {...form.getInputProps("control", { type: "checkbox" })}
          />
        </form>

        <Flex justify="end" gap="md" mt="md">
          {renderFooterButtons?.({ onResetForm: form.reset, formId: idForm })}
        </Flex>
      </>
    );
  }
);
