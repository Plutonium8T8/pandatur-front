import { useEffect } from "react";
import { Select, TextInput, Flex } from "@mantine/core";
import { getLanguageByKey } from "../utils";
import {
  motivulRefuzuluiOptions,
  evaluareOdihnaOptions,
} from "../../FormOptions";

const QUALITY_FORM_FILTER_ID = "QUALITY_FORM_FILTER_ID";

export const QualityControlForm = ({
  onSubmit,
  data,
  renderFooterButtons,
  formInstance,
}) => {
  useEffect(() => {
    if (data) {
      formInstance.setValues({
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
        id={QUALITY_FORM_FILTER_ID}
        onSubmit={formInstance.onSubmit((values) => {
          onSubmit(values, () => formInstance.reset());
        })}
      >
        {
          <Select
            clearable
            searchable
            label={getLanguageByKey("Motivul refuzului")}
            placeholder={getLanguageByKey("Motivul refuzului")}
            data={motivulRefuzuluiOptions}
            key={formInstance.key("motivul_refuzului")}
            {...formInstance.getInputProps("motivul_refuzului")}
          />
        }

        <Select
          mt="md"
          clearable
          searchable
          label={getLanguageByKey("Evaluare odihnă")}
          placeholder={getLanguageByKey("Evaluare odihnă")}
          data={evaluareOdihnaOptions}
          key={formInstance.key("evaluare_de_odihna")}
          {...formInstance.getInputProps("evaluare_de_odihna")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Următoarea vacanță")}
          placeholder={getLanguageByKey("Următoarea vacanță")}
          key={formInstance.key("urmatoarea_vacanta")}
          {...formInstance.getInputProps("urmatoarea_vacanta")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Manager")}
          placeholder={getLanguageByKey("Manager")}
          key={formInstance.key("manager")}
          {...formInstance.getInputProps("manager")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Vacanța")}
          placeholder={getLanguageByKey("Vacanța")}
          key={formInstance.key("vacanta")}
          {...formInstance.getInputProps("vacanta")}
        />
      </form>
    </>
  );
};
