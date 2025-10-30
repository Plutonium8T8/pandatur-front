import {
  Select,
  Flex,
  NumberInput,
  MultiSelect,
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
import { YYYY_MM_DD } from "../../../app-constants";

const TICKET_FORM_FILTER_ID = "TICKET_FORM_FILTER_ID";

export const TicketInfoFormFilter = forwardRef(
  ({ data, hideDisabledInput, renderFooterButtons, setMinDate, formId }, ref) => {
    const idForm = formId || TICKET_FORM_FILTER_ID;

    const form = useForm({
      mode: "controlled",
      initialValues: {
        data_plecarii: [null, null],
        data_venit_in_oficiu: [null, null],
        data_intoarcerii: [null, null],
        data_cererii_de_retur: [null, null],
        buget: "",
        sursa_lead: [],
        promo: [],
        marketing: [],
        tipul_serviciului: [],
        tara: [],
        tip_de_transport: [],
        denumirea_excursiei_turului: [],
        procesarea_achizitionarii: [],
      },
      transformValues: (values) => ({
        data_plecarii: formatDateOrUndefined(values.data_plecarii),
        data_venit_in_oficiu: formatDateOrUndefined(values.data_venit_in_oficiu),
        data_intoarcerii: formatDateOrUndefined(values.data_intoarcerii),
        data_cererii_de_retur: formatDateOrUndefined(values.data_cererii_de_retur),
        buget: formatNumericValue(values.buget),
        sursa_lead: values.sursa_lead ?? undefined,
        promo: values.promo ?? undefined,
        marketing: values.marketing ?? undefined,
        tipul_serviciului: values.tipul_serviciului ?? undefined,
        tara: values.tara ?? undefined,
        tip_de_transport: values.tip_de_transport ?? undefined,
        denumirea_excursiei_turului: values.denumirea_excursiei_turului ?? undefined,
        procesarea_achizitionarii: values.procesarea_achizitionarii ?? undefined,
      }),
    });

    useEffect(() => {
      if (data) {
        form.setValues({
          data_venit_in_oficiu: convertDateToArray(data.data_venit_in_oficiu),
          data_plecarii: convertDateToArray(data.data_plecarii),
          data_intoarcerii: convertDateToArray(data.data_intoarcerii),
          data_cererii_de_retur: convertDateToArray(data.data_cererii_de_retur),
          buget: convertNumberRangeToSingleValue(data.buget),
          sursa_lead: data.sursa_lead || [],
          promo: data.promo || [],
          marketing: data.marketing || [],
          tipul_serviciului: data.tipul_serviciului || [],
          tara: data.tara || [],
          tip_de_transport: data.tip_de_transport || [],
          denumirea_excursiei_turului: data.denumirea_excursiei_turului || [],
          procesarea_achizitionarii: data.procesarea_achizitionarii || [],
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
            valueFormat={YYYY_MM_DD}
            clearable
            mt="md"
            label={getLanguageByKey("Data venit in oficiu")}
            placeholder={getLanguageByKey("Selectează data venirii în oficiu")}
            key={form.key("data_venit_in_oficiu")}
            {...form.getInputProps("data_venit_in_oficiu")}
            getDayProps={getDayPropsWithHighlight}
          />

          <DatePickerInput
            type="range"
            minDate={setMinDate}
            clearable
            valueFormat={YYYY_MM_DD}
            mt="md"
            label={getLanguageByKey("Data și ora plecării")}
            placeholder={getLanguageByKey("Data și ora plecării")}
            key={form.key("data_plecarii")}
            {...form.getInputProps("data_plecarii")}
            getDayProps={getDayPropsWithHighlight}
          />

          <DatePickerInput
            type="range"
            minDate={setMinDate}
            clearable
            valueFormat={YYYY_MM_DD}
            mt="md"
            label={getLanguageByKey("Data și ora întoarcerii")}
            placeholder={getLanguageByKey("Data și ora întoarcerii")}
            key={form.key("data_intoarcerii")}
            {...form.getInputProps("data_intoarcerii")}
            getDayProps={getDayPropsWithHighlight}
          />

          <DatePickerInput
            type="range"
            minDate={setMinDate}
            clearable
            valueFormat={YYYY_MM_DD}
            mt="md"
            label={getLanguageByKey("Data cererii de retur")}
            placeholder={getLanguageByKey("Data cererii de retur")}
            key={form.key("data_cererii_de_retur")}
            {...form.getInputProps("data_cererii_de_retur")}
            getDayProps={getDayPropsWithHighlight}
          />

          {!hideDisabledInput && (
            <Select
              disabled
              mt="md"
              label={getLanguageByKey("Status sunet telefonic")}
              placeholder={getLanguageByKey("Status sunet telefonic")}
              data={[]}
              clearable
              searchable
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
            searchable
          />

          <MultiSelect
            mt="md"
            label={getLanguageByKey("Promo")}
            placeholder={getLanguageByKey("Promo")}
            data={promoOptions}
            clearable
            key={form.key("promo")}
            {...form.getInputProps("promo")}
            searchable
          />

          <MultiSelect
            mt="md"
            label={getLanguageByKey("Marketing")}
            placeholder={getLanguageByKey("Marketing")}
            data={marketingOptions}
            clearable
            key={form.key("marketing")}
            {...form.getInputProps("marketing")}
            searchable
          />

          <MultiSelect
            mt="md"
            label={getLanguageByKey("Serviciu")}
            placeholder={getLanguageByKey("Serviciu")}
            data={serviceTypeOptions}
            clearable
            key={form.key("tipul_serviciului")}
            {...form.getInputProps("tipul_serviciului")}
            searchable
          />

          <MultiSelect
            mt="md"
            label={getLanguageByKey("Țară")}
            placeholder={getLanguageByKey("Țară")}
            data={countryOptions}
            clearable
            key={form.key("tara")}
            {...form.getInputProps("tara")}
            searchable
          />

          <MultiSelect
            mt="md"
            label={getLanguageByKey("Transport")}
            placeholder={getLanguageByKey("Transport")}
            data={transportOptions}
            clearable
            key={form.key("tip_de_transport")}
            {...form.getInputProps("tip_de_transport")}
            searchable
          />

          <MultiSelect
            mt="md"
            label={getLanguageByKey("Excursie")}
            placeholder={getLanguageByKey("Excursie")}
            data={nameExcursionOptions}
            clearable
            key={form.key("denumirea_excursiei_turului")}
            {...form.getInputProps("denumirea_excursiei_turului")}
            searchable
          />

          <MultiSelect
            mt="md"
            label={getLanguageByKey("Achiziție")}
            placeholder={getLanguageByKey("Achiziție")}
            data={purchaseProcessingOptions}
            clearable
            key={form.key("procesarea_achizitionarii")}
            {...form.getInputProps("procesarea_achizitionarii")}
            searchable
          />
        </form>

        <Flex justify="end" gap="md" mt="md">
          {renderFooterButtons?.({ onResetForm: form.reset, formId: idForm })}
        </Flex>
      </>
    );
  }
);
