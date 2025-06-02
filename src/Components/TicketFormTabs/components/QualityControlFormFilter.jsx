import { useEffect } from "react";
import { MultiSelect, TextInput, Flex } from "@mantine/core";
import { useForm } from "@mantine/form";
import { getLanguageByKey } from "../../utils";
import {
  motivulRefuzuluiOptions,
  evaluareOdihnaOptions,
} from "../../../FormOptions";

const QUALITY_CONTROL_FORM_FILTER = "QUALITY_CONTROL_FORM_FILTER";

export const QualityControlFormFilter = ({ onSubmit, data, renderFooterButtons }) => {
  const form = useForm({
    mode: "uncontrolled",

    transformValues: ({
      motivul_refuzului,
      evaluare_de_odihna,
      urmatoarea_vacanta,
      manager,
      vacanta,
    }) => {
      return {
        motivul_refuzului: motivul_refuzului ?? undefined,
        evaluare_de_odihna: evaluare_de_odihna ?? undefined,
        urmatoarea_vacanta: urmatoarea_vacanta ?? undefined,
        manager: manager ?? undefined,
        vacanta: vacanta ?? undefined,
      };
    },
  });

  useEffect(() => {
    if (data) {
      form.setValues({
        motivul_refuzului: data.motivul_refuzului,
        evaluare_de_odihna: data.evaluare_de_odihna,
        urmatoarea_vacanta: data.urmatoarea_vacanta,
        manager: data.manager,
        vacanta: data.vacanta,
      });
    }
  }, [data]);

  return (
    <>
      <form
        id={QUALITY_CONTROL_FORM_FILTER}
        onSubmit={form.onSubmit((values) =>
          onSubmit(values, () => form.reset()),
        )}
      >
        {
          <MultiSelect
            clearable
            searchable
            label={getLanguageByKey("Motivul refuzului")}
            placeholder={getLanguageByKey("Motivul refuzului")}
            data={motivulRefuzuluiOptions}
            key={form.key("motivul_refuzului")}
            {...form.getInputProps("motivul_refuzului")}
          />
        }

        <MultiSelect
          mt="md"
          clearable
          searchable
          label={getLanguageByKey("Evaluare odihnă")}
          placeholder={getLanguageByKey("Evaluare odihnă")}
          data={evaluareOdihnaOptions}
          key={form.key("evaluare_de_odihna")}
          {...form.getInputProps("evaluare_de_odihna")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Următoarea vacanță")}
          placeholder={getLanguageByKey("Următoarea vacanță")}
          key={form.key("urmatoarea_vacanta")}
          {...form.getInputProps("urmatoarea_vacanta")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Manager")}
          placeholder={getLanguageByKey("Manager")}
          key={form.key("manager")}
          {...form.getInputProps("manager")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Vacanța")}
          placeholder={getLanguageByKey("Vacanța")}
          key={form.key("vacanta")}
          {...form.getInputProps("vacanta")}
        />
      </form>

      <Flex justify="end" gap="md" mt="md">
        {renderFooterButtons?.({
          onResetForm: form.reset,
          formId: QUALITY_CONTROL_FORM_FILTER,
        })}
      </Flex>
    </>
  );
};
