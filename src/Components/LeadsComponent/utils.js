import { workflowOptionsSalesMD } from "../../Components/utils/workflowUtils";
import dayjs from "dayjs";
import { DD_MM_YYYY__HH_mm_ss, DD_MM_YYYY } from "../../app-constants";

export const VIEW_MODE = {
  KANBAN: "KANBAN",
  LIST: "LIST",
};

export const platformOptions = [
  "telegram",
  "viber",
  "whatsapp",
  "facebook",
  "instagram",
  "sipuni",
];

export const filteredWorkflows = workflowOptionsSalesMD.filter(
  (wf) => wf !== "Realizat cu succes" && wf !== "Închis și nerealizat",
);

export const filterDefaults = {
  workflow: filteredWorkflows,
  tags: [],
};

export const formatDateOrUndefined = (date) => {
  const minDate = date?.[0];
  const maxDate = date?.[1];

  return minDate && maxDate
    ? {
      from: dayjs(minDate).format(DD_MM_YYYY__HH_mm_ss),
      to: dayjs(maxDate).format(DD_MM_YYYY__HH_mm_ss),
    }
    : undefined;
};

export const formatDateOrUndefinedFilter = (date) => {
  const minDate = date?.[0];
  const maxDate = date?.[1];

  return minDate && maxDate
    ? {
      from: dayjs(minDate).format(DD_MM_YYYY),
      to: dayjs(maxDate).format(DD_MM_YYYY),
    }
    : undefined;
};

export const formatNumericValue = (value) => {
  const rangeValue = value ? { from: value, to: value } : value;
  return rangeValue;
};

export const convertDateToArray = (rangeDate = {}) => {
  const { from, to } = rangeDate;

  return [
    from ? dayjs(from, DD_MM_YYYY__HH_mm_ss) : undefined,
    to ? dayjs(to, DD_MM_YYYY__HH_mm_ss) : undefined,
  ];
};

export const convertDateToArrayFilter = (rangeDate = {}) => {
  const { from, to } = rangeDate;

  return [
    from ? dayjs(from, DD_MM_YYYY) : undefined,
    to ? dayjs(to, DD_MM_YYYY) : undefined,
  ];
};

export const convertNumberRangeToSingleValue = (range = {}) => {
  const { from, to } = range;
  // NOTE: `from` and `to` have the same value

  return from && to ? from : undefined;
};
