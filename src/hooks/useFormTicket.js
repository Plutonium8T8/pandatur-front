import { useState, useEffect } from "react"
import { useForm } from "@mantine/form"
import { formatDate } from "../Components/utils"
import { getLanguageByKey } from "../Components/utils"

export const useFormTicket = () => {
  const [hasErrorsTicketInfoForm, setHasErrorsTicketInfoForm] = useState()
  const [hasErrorsContractForm, setHasErrorsContractForm] = useState()
  const [hasErrorQualityControl, setHasErrorQualityControl] = useState()

  const form = useForm({
    mode: "uncontrolled",

    validate: {
      sursa_lead: (value, values) => {
        if (
          (values.workflow === "Luat în lucru" ||
            values.workflow === "Ofertă trimisă" ||
            values.workflow === "Aprobat cu client" ||
            values.workflow === "Contract semnat" ||
            values.workflow === "Plată primită" ||
            values.workflow === "Contract încheiat" ||
            values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },

      promo: (value, values) => {
        if (
          (values.workflow === "Luat în lucru" ||
            values.workflow === "Ofertă trimisă" ||
            values.workflow === "Aprobat cu client" ||
            values.workflow === "Contract semnat" ||
            values.workflow === "Plată primită" ||
            values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      marketing: (value, values) => {
        if (
          (values.workflow === "Luat în lucru" ||
            values.workflow === "Ofertă trimisă" ||
            values.workflow === "Aprobat cu client" ||
            values.workflow === "Contract semnat" ||
            values.workflow === "Plată primită" ||
            values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      tipul_serviciului: (value, values) => {
        if (
          (values.workflow === "Ofertă trimisă" ||
            values.workflow === "Aprobat cu client" ||
            values.workflow === "Contract semnat" ||
            values.workflow === "Plată primită" ||
            values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      tara: (value, values) => {
        if (
          (values.workflow === "Ofertă trimisă" ||
            values.workflow === "Aprobat cu client" ||
            values.workflow === "Contract semnat" ||
            values.workflow === "Plată primită" ||
            values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      tip_de_transport: (value, values) => {
        if (
          (values.workflow === "Ofertă trimisă" ||
            values.workflow === "Aprobat cu client" ||
            values.workflow === "Contract semnat" ||
            values.workflow === "Plată primită" ||
            values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      denumirea_excursiei_turului: (value, values) => {
        if (
          (values.workflow === "Ofertă trimisă" ||
            values.workflow === "Aprobat cu client" ||
            values.workflow === "Contract semnat" ||
            values.workflow === "Plată primită" ||
            values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      procesarea_achizitionarii: (value, values) => {
        if (
          (values.workflow === "Aprobat cu client" ||
            values.workflow === "Contract semnat" ||
            values.workflow === "Plată primită" ||
            values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      numar_de_contract: (value, values) => {
        if (
          (values.workflow === "Contract semnat" ||
            values.workflow === "Plată primită" ||
            values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      data_contractului: (value, values) => {
        if (
          (values.workflow === "Contract semnat" ||
            values.workflow === "Plată primită" ||
            values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      contract_trimis: (value, values) => {
        if (
          (values.workflow === "Contract semnat" ||
            values.workflow === "Plată primită" ||
            values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      contract_semnat: (value, values) => {
        if (
          (values.workflow === "Contract semnat" ||
            values.workflow === "Plată primită" ||
            values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      achitare_efectuata: (value, values) => {
        if (
          (values.workflow === "Plată primită" ||
            values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      buget: (value, values) => {
        if (
          (values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      data_plecarii: (value, values) => {
        if (
          (values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      data_intoarcerii: (value, values) => {
        if (
          (values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      tour_operator: (value, values) => {
        if (
          (values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      numarul_cererii_de_la_operator: (value, values) => {
        if (
          (values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },

      rezervare_confirmata: (value, values) => {
        if (
          (values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      contract_arhivat: (value, values) => {
        if (
          (values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      statutul_platii: (value, values) => {
        if (
          (values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      pret_netto: (value, values) => {
        if (
          (values.workflow === "Contract încheiat" ||
            values.workflow === "Realizat cu succes") &&
          !value
        ) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      control: (value, values) => {
        if (values.workflow === "Realizat cu succes" && !value) {
          return getLanguageByKey("workflow_change_field_required")
        }
      },
      motivul_refuzului: (value, values) => {
        if (values.workflow === "Închis și nerealizat" && !value) {
          return getLanguageByKey("workflow_change_field_required")
        }
      }
    },

    transformValues: ({
      data_venit_in_oficiu,
      data_plecarii,
      data_intoarcerii,
      data_cererii_de_retur,
      data_contractului,
      data_avansului,
      data_de_plata_integrala,
      contract_trimis,
      contract_semnat,
      achitare_efectuata,
      rezervare_confirmata,
      contract_arhivat,
      control,
      workflow,
      ...rest
    }) => {
      const formattedData = {
        data_venit_in_oficiu: formatDate(data_venit_in_oficiu),
        data_plecarii: formatDate(data_plecarii),
        data_intoarcerii: formatDate(data_intoarcerii),
        data_cererii_de_retur: formatDate(data_cererii_de_retur),
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
    const {
      sursa_lead,
      promo,
      marketing,
      tipul_serviciului,
      tara,
      tip_de_transport,
      denumirea_excursiei_turului,
      procesarea_achizitionarii,
      buget,
      data_plecarii,
      data_intoarcerii,
      motivul_refuzului,
      control,
      pret_netto,
      statutul_platii,
      contract_arhivat,
      rezervare_confirmata,
      numarul_cererii_de_la_operator,
      tour_operator,
      numar_de_contract,
      data_contractului,
      contract_trimis,
      contract_semnat
    } = form.errors

    if (motivul_refuzului) {
      setHasErrorQualityControl(true)
    } else {
      setHasErrorQualityControl(false)
    }

    if (
      [
        numar_de_contract,
        control,
        pret_netto,
        statutul_platii,
        contract_arhivat,
        rezervare_confirmata,
        numarul_cererii_de_la_operator,
        tour_operator,
        data_contractului,
        contract_trimis,
        contract_semnat
      ].some((value) => value)
    ) {
      setHasErrorsContractForm(true)
    } else {
      setHasErrorsContractForm(false)
    }

    if (
      [
        sursa_lead,
        promo,
        marketing,
        tipul_serviciului,
        tara,
        tip_de_transport,
        denumirea_excursiei_turului,
        procesarea_achizitionarii,
        buget,
        data_plecarii,
        data_intoarcerii
      ].some((value) => value)
    ) {
      setHasErrorsTicketInfoForm(true)
    } else {
      setHasErrorsTicketInfoForm(false)
    }
  }, [form])

  return {
    form,
    hasErrorsTicketInfoForm,
    hasErrorsContractForm,
    hasErrorQualityControl
  }
}
