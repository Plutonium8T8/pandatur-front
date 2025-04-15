import { Select, Flex, NumberInput, MultiSelect } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { MdOutlineEuroSymbol } from "react-icons/md";
import { getLanguageByKey } from "../../utils";
import {
  formatDateOrUndefined,
  formatNumericValue,
  convertDateToArray,
  convertNumberRangeToSingleValue,
} from "../../LeadsComponent/utils";
import {
  sourceOfLeadOptions,
  promoOptions,
  marketingOptions,
  serviceTypeOptions,
  countryOptions,
  transportOptions,
  nameExcursionOptions,
  purchaseProcessingOptions,
} from "../../../FormOptions";
import { DD_MM_YYYY } from "../../../app-constants";

const TICKET_FORM_FILTER_ID = "TICKET_FORM_FILTER_ID";

export const TicketInfoForm = ({
  onSubmit,
  data,
  hideDisabledInput,
  renderFooterButtons,
  setMinDate,
  formId,
}) => {
  const idForm = formId || TICKET_FORM_FILTER_ID;

  const form = useForm({
    mode: "uncontrolled",

    transformValues: ({
      data_venit_in_oficiu,
      data_plecarii,
      data_intoarcerii,
      data_cererii_de_retur,
      buget,
      sursa_lead,
      promo,
      marketing,
      tipul_serviciului,
      tara,
      tip_de_transport,
      denumirea_excursiei_turului,
      procesarea_achizitionarii,
      ...rest
    }) => {
      const formattedData = {
        data_plecarii: formatDateOrUndefined(data_plecarii),
        data_venit_in_oficiu: formatDateOrUndefined(data_venit_in_oficiu),

        data_intoarcerii: formatDateOrUndefined(data_intoarcerii),
        data_cererii_de_retur: formatDateOrUndefined(data_cererii_de_retur),
        buget: formatNumericValue(buget),
        sursa_lead: sursa_lead ?? undefined,
        promo: promo ?? undefined,
        marketing: marketing ?? undefined,
        tipul_serviciului: tipul_serviciului ?? undefined,
        tara: tara ?? undefined,
        tip_de_transport: tip_de_transport ?? undefined,
        denumirea_excursiei_turului: denumirea_excursiei_turului ?? undefined,
        procesarea_achizitionarii: procesarea_achizitionarii ?? undefined,
      };

      return { ...formattedData, ...rest };
    },
  });

  useEffect(() => {
    if (data) {
      form.setValues({
        data_venit_in_oficiu: convertDateToArray(data.data_venit_in_oficiu),
        data_plecarii: convertDateToArray(data.data_plecarii),
        data_intoarcerii: convertDateToArray(data.data_intoarcerii),
        data_cererii_de_retur: convertDateToArray(data.data_cererii_de_retur),
        buget: convertNumberRangeToSingleValue(data.buget),
        sursa_lead: data.sursa_lead,
        promo: data.promo,
        marketing: data.marketing,
        tipul_serviciului: data.tipul_serviciului,
        tara: data.tara,
        tip_de_transport: data.tip_de_transport,
        denumirea_excursiei_turului: data.denumirea_excursiei_turului,
        procesarea_achizitionarii: data.procesarea_achizitionarii,
      });
    }
  }, [data]);

  return (
    <>
      <form
        id={idForm}
        onSubmit={form.onSubmit((values) =>
          onSubmit(values, () => form.reset()),
        )}
      >
        <NumberInput
          hideControls
          label={getLanguageByKey("Vânzare")}
          placeholder={getLanguageByKey("Indicați suma în euro")}
          decimalScale={2}
          fixedDecimalScale
          leftSection={<MdOutlineEuroSymbol />}
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
          type="range"
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

        <MultiSelect
          mt="md"
          label={getLanguageByKey("Sursă lead")}
          placeholder={getLanguageByKey("Sursă lead")}
          data={sourceOfLeadOptions}
          clearable
          key={form.key("sursa_lead")}
          {...form.getInputProps("sursa_lead")}
        />

        <MultiSelect
          mt="md"
          label={getLanguageByKey("Promo")}
          placeholder={getLanguageByKey("Promo")}
          data={promoOptions}
          clearable
          key={form.key("promo")}
          {...form.getInputProps("promo")}
        />

        <MultiSelect
          mt="md"
          label={getLanguageByKey("Marketing")}
          placeholder={getLanguageByKey("Marketing")}
          data={marketingOptions}
          clearable
          key={form.key("marketing")}
          {...form.getInputProps("marketing")}
        />

        <MultiSelect
          mt="md"
          label={getLanguageByKey("Serviciu")}
          placeholder={getLanguageByKey("Serviciu")}
          data={serviceTypeOptions}
          clearable
          key={form.key("tipul_serviciului")}
          {...form.getInputProps("tipul_serviciului")}
        />

        <MultiSelect
          mt="md"
          label={getLanguageByKey("Țară")}
          placeholder={getLanguageByKey("Țară")}
          data={countryOptions}
          clearable
          key={form.key("tara")}
          {...form.getInputProps("tara")}
        />

        <MultiSelect
          mt="md"
          label={getLanguageByKey("Transport")}
          placeholder={getLanguageByKey("Transport")}
          data={transportOptions}
          clearable
          key={form.key("tip_de_transport")}
          {...form.getInputProps("tip_de_transport")}
        />

        <MultiSelect
          mt="md"
          label={getLanguageByKey("Excursie")}
          placeholder={getLanguageByKey("Excursie")}
          data={nameExcursionOptions}
          clearable
          key={form.key("denumirea_excursiei_turului")}
          {...form.getInputProps("denumirea_excursiei_turului")}
        />

        <MultiSelect
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
  );
};
