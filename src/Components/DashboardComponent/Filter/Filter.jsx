import { getLanguageByKey } from "../../utils";
import "./Filter.css";
import { Button, MultiSelect } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { DD_MM_YYYY } from "../../../app-constants";
import { useGetTechniciansList } from "../../../hooks";
import dayjs from "dayjs";
import { useMemo } from "react";
import { formatMultiSelectData, getGroupUserMap } from "../../utils/multiSelectUtils";

const getStartEndDateRange = (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return [startOfDay, endOfDay];
};

const getYesterdayDate = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return getStartEndDateRange(yesterday);
};

export const Filter = ({
  onSelectedTechnicians,
  onSelectDataRange,
  selectedTechnicians = [],
  dateRange = [],
}) => {
  const { technicians, loading: loadingTechnicians } = useGetTechniciansList();

  // подготовим данные для мультиселекта: группы + пользователи
  const formattedTechnicians = useMemo(
    () => formatMultiSelectData(technicians),
    [technicians]
  );
  const groupUserMap = useMemo(
    () => getGroupUserMap(technicians),
    [technicians]
  );

  const handleUsersChange = (val) => {
    // последний выбранный элемент
    const last = val[val.length - 1];
    const isGroup = typeof last === "string" && last.startsWith("__group__");

    if (isGroup) {
      const groupUsers = groupUserMap.get(last) || [];
      const unique = Array.from(new Set([...(selectedTechnicians || []), ...groupUsers]));
      onSelectedTechnicians(unique);
    } else {
      onSelectedTechnicians(val || []);
    }
  };

  const isToday =
    dateRange?.[0] && dateRange?.[1] &&
    dayjs(dateRange[0]).isSame(dayjs(), "day") &&
    dayjs(dateRange[1]).isSame(dayjs(), "day");

  const isYesterday =
    dateRange?.[0] && dateRange?.[1] &&
    dayjs(dateRange[0]).isSame(dayjs().subtract(1, "day"), "day") &&
    dayjs(dateRange[1]).isSame(dayjs().subtract(1, "day"), "day");

  return (
    <div className="d-flex gap-8 justify-content-center align-items-center mb-16">
      <div className="dashboard-filter-multi-select">
        <MultiSelect
          data={formattedTechnicians}
          value={selectedTechnicians}
          onChange={handleUsersChange}
          searchable
          clearable
          placeholder={getLanguageByKey("Selectează operatorii")}
          nothingFoundMessage={getLanguageByKey("Nimic găsit")}
          maxDropdownHeight={300}
          disabled={loadingTechnicians}
          aria-label="Users"
        />
      </div>

      <div className="d-flex">
        <Button
          variant={isToday ? "filled" : "default"}
          onClick={() => onSelectDataRange(getStartEndDateRange(new Date()))}
        >
          {getLanguageByKey("azi")}
        </Button>

        <Button
          variant={isYesterday ? "filled" : "default"}
          onClick={() => onSelectDataRange(getYesterdayDate())}
        >
          {getLanguageByKey("ieri")}
        </Button>

        <DatePickerInput
          className="dashboard-filter-date-input"
          clearable
          valueFormat={DD_MM_YYYY}
          type="range"
          placeholder={getLanguageByKey("Selectează o dată")}
          value={dateRange}
          onChange={(date) => onSelectDataRange(date || [])}
        />
      </div>
    </div>
  );
};
