import dayjs from "dayjs";
import { DD_MM_YYYY_DASH, DD_MM_YYYY } from "../../app-constants";

const parseBoolean = (val) => {
    if (val === "true") return true;
    if (val === "false") return false;
    return undefined;
};

const parseDateRange = (from, to, format = DD_MM_YYYY) => {
    const result = {};
    if (from && dayjs(from, format, true).isValid()) result.from = from;
    if (to && dayjs(to, format, true).isValid()) result.to = to;
    return Object.keys(result).length ? result : undefined;
};

export const parseFiltersFromUrl = (params) => {
    const get = (key) => params.get(key);
    const getAll = (key) => params.getAll(key); // всегда массив (0, 1 или много)
    const getFromTo = (key, format = DD_MM_YYYY) =>
        parseDateRange(get(`${key}_from`), get(`${key}_to`), format);

    // Всегда массив строк (multi-select)
    const parseMulti = (key) => {
        const arr = getAll(key);
        if (!arr.length) return undefined;
        return arr;
    };

    // Всегда массив строк (id-шники)
    const parseNumberMulti = (key) => {
        const arr = getAll(key);
        if (!arr.length) return undefined;
        return arr.map((v) => String(Number(v))).filter(Boolean);
    };

    return {
        // MessageFilterForm
        message: get("message") || undefined,
        mtype: get("mtype") || undefined,
        sender_id: parseNumberMulti("sender_id"),
        time_sent: getFromTo("time_sent", DD_MM_YYYY_DASH),
        last_message_author: parseNumberMulti("last_message_author"),
        action_needed: parseBoolean(get("action_needed")),
        unseen: get("unseen") || undefined,

        // BasicGeneralFormFilter
        workflow: parseMulti("workflow"),
        priority: parseMulti("priority"),
        contact: get("contact") || undefined,
        tags: parseMulti("tags"),
        technician_id: parseNumberMulti("technician_id"),
        creation_date: getFromTo("creation_date", DD_MM_YYYY_DASH),
        last_interaction_date: getFromTo("last_interaction_date", DD_MM_YYYY_DASH),

        // TicketInfoFormFilter
        buget: get("buget") !== null && get("buget") !== undefined && get("buget") !== "" ? Number(get("buget")) : undefined,
        sursa_lead: parseMulti("sursa_lead"),
        promo: parseMulti("promo"),
        marketing: parseMulti("marketing"),
        tipul_serviciului: parseMulti("tipul_serviciului"),
        tara: parseMulti("tara"),
        tip_de_transport: parseMulti("tip_de_transport"),
        denumirea_excursiei_turului: parseMulti("denumirea_excursiei_turului"),
        procesarea_achizitionarii: parseMulti("procesarea_achizitionarii"),
        data_plecarii: getFromTo("data_plecarii"),
        data_venit_in_oficiu: getFromTo("data_venit_in_oficiu"),
        data_intoarcerii: getFromTo("data_intoarcerii"),
        data_cererii_de_retur: getFromTo("data_cererii_de_retur"),

        // ContractFormFilter
        numar_de_contract: get("numar_de_contract") || undefined,
        data_contractului: getFromTo("data_contractului"),
        data_avansului: getFromTo("data_avansului"),
        data_de_plata_integrala: getFromTo("data_de_plata_integrala"),
        contract_trimis: parseBoolean(get("contract_trimis")),
        contract_semnat: parseBoolean(get("contract_semnat")),
        tour_operator: get("tour_operator") || undefined,
        numarul_cererii_de_la_operator: get("numarul_cererii_de_la_operator") || undefined,
        achitare_efectuata: parseBoolean(get("achitare_efectuata")),
        rezervare_confirmata: parseBoolean(get("rezervare_confirmata")),
        contract_arhivat: parseBoolean(get("contract_arhivat")),
        statutul_platii: get("statutul_platii") || undefined,
        avans_euro: get("avans_euro") !== null && get("avans_euro") !== undefined && get("avans_euro") !== "" ? Number(get("avans_euro")) : undefined,
        pret_netto: get("pret_netto") !== null && get("pret_netto") !== undefined && get("pret_netto") !== "" ? Number(get("pret_netto")) : undefined,
        achitat_client: get("achitat_client") !== null && get("achitat_client") !== undefined && get("achitat_client") !== "" ? Number(get("achitat_client")) : undefined,
        control: parseBoolean(get("control")),

        // QualityControlFormFilter
        motivul_refuzului: parseMulti("motivul_refuzului"),
        evaluare_de_odihna: parseMulti("evaluare_de_odihna"),
        urmatoarea_vacanta: get("urmatoarea_vacanta") || undefined,
        manager: get("manager") || undefined,
        vacanta: get("vacanta") || undefined,

        // group_title всегда строка!
        group_title: get("group_title") || undefined,
    };
};
