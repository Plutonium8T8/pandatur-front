import React, { useState, useEffect } from "react";
import { startOfWeek, addDays, format } from "date-fns";

const ScheduleComponent = () => {
  const [schedule, setSchedule] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  };

  useEffect(() => {
    fetch("https://pandatur-api.com/users-technician")
      .then((response) => response.json())
      .then((data) => {
        const formattedSchedule = data.map((technician) => ({
          id: technician.id.id.id,
          name: `${technician.id.name} ${technician.id.surname}`,
          shifts: ["", "", "", "", "", "", ""], // пустые смены по умолчанию
        }));
        setSchedule(formattedSchedule);
      })
      .catch((error) => console.error("Ошибка загрузки данных:", error));
  }, []);

  const handleShiftChange = (employeeIndex, dayIndex) => {
    setSelectedEmployee(employeeIndex);
    setSelectedDay(dayIndex);

    const currentShift = schedule[employeeIndex].shifts[dayIndex];
    if (currentShift) {
      const [start, end] = currentShift.split(" - ");
      setStartTime(start || "");
      setEndTime(end || "");
    } else {
      setStartTime("");
      setEndTime("");
    }
  };

  const saveShift = () => {
    const updatedSchedule = [...schedule];
    updatedSchedule[selectedEmployee].shifts[selectedDay] = `${startTime} - ${endTime}`;
    setSchedule(updatedSchedule);
    setSelectedEmployee(null);
    setSelectedDay(null);
    setStartTime("");
    setEndTime("");
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  return (
    <div className="schedule-container">
      <h1>График работы</h1>
      <div className="week-navigation">
        <button onClick={goToPreviousWeek}>Предыдущая неделя</button>
        <span>
          Неделя {format(currentWeekStart, "dd.MM.yyyy")} - {format(addDays(currentWeekStart, 6), "dd.MM.yyyy")}
        </span>
        <button onClick={goToNextWeek}>Следующая неделя</button>
      </div>
      <table className="schedule-table">
        <thead>
          <tr>
            <th>Сотрудник</th>
            {getWeekDays().map((day, index) => (
              <th key={index}>{format(day, "EEEE, dd.MM")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schedule.map((employee, employeeIndex) => (
            <tr key={employeeIndex}>
              <td>
                {employee.name} ({employee.id})
              </td>
              {employee.shifts.map((shift, dayIndex) => (
                <td
                  key={dayIndex}
                  className="shift-cell"
                  onClick={() => handleShiftChange(employeeIndex, dayIndex)}
                >
                  {shift || "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {selectedEmployee !== null && selectedDay !== null && (
        <div className="shift-editor">
          <h3>Изменить смену</h3>
          <p>
            {schedule[selectedEmployee].name} ({schedule[selectedEmployee].id}), {format(getWeekDays()[selectedDay], "EEEE, dd.MM")}
          </p>
          <div className="time-inputs">
            <label>
              Начало рабочего дня:
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
            <label>
              Конец рабочего дня:
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
          </div>
          <button onClick={saveShift}>Сохранить</button>
          <button
            onClick={() => {
              setSelectedEmployee(null);
              setSelectedDay(null);
              setStartTime("");
              setEndTime("");
            }}
          >
            Отмена
          </button>
        </div>
      )}

      <style jsx>{`
        .schedule-container {
          padding: 20px;
        }
        .week-navigation {
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .schedule-table {
          width: 100%;
          border-collapse: collapse;
        }
        .schedule-table th,
        .schedule-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: center;
        }
        .schedule-table th {
          background-color: #f4f4f4;
        }
        .shift-cell {
          cursor: pointer;
          background-color: #f9f9f9;
        }
        .shift-cell:hover {
          background-color: #e0e0e0;
        }
        .shift-editor {
          margin-top: 20px;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }
        .time-inputs label {
          display: block;
          margin-bottom: 10px;
        }
        .time-inputs input {
          margin-left: 10px;
        }
        .shift-editor button {
          margin-right: 10px;
          padding: 5px 10px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default ScheduleComponent;