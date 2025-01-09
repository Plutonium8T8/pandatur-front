import React, { useState, useEffect } from "react";
import { startOfWeek, addDays, format } from "date-fns";
import './AdminPanel.css';

const ScheduleComponent = () => {
  const [schedule, setSchedule] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [shortStartTime, setShortStartTime] = useState("");
  const [shortEndTime, setShortEndTime] = useState("");
  const [isShortTimeEnabled, setIsShortTimeEnabled] = useState(false);
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
      const [start, end, shortStart, shortEnd] = currentShift.split(" - ");
      setStartTime(start || "");
      setEndTime(end || "");
      setShortStartTime(shortStart || "");
      setShortEndTime(shortEnd || "");
      setIsShortTimeEnabled(!!shortStart && !!shortEnd);
    } else {
      setStartTime("");
      setEndTime("");
      setShortStartTime("");
      setShortEndTime("");
      setIsShortTimeEnabled(false);
    }
  };

  const saveShift = () => {
    const updatedSchedule = [...schedule];
    const shift = isShortTimeEnabled
      ? `${startTime} - ${endTime} - ${shortStartTime} - ${shortEndTime}`
      : `${startTime} - ${endTime}`;
    updatedSchedule[selectedEmployee].shifts[selectedDay] = shift;
    setSchedule(updatedSchedule);
    setSelectedEmployee(null);
    setSelectedDay(null);
    setStartTime("");
    setEndTime("");
    setShortStartTime("");
    setShortEndTime("");
    setIsShortTimeEnabled(false);
  };

  const calculateWorkedHours = (shift) => {
    if (!shift) return 0;
    const [start, end, shortStart, shortEnd] = shift.split(" - ");
    const startTime = parseTime(start);
    const endTime = parseTime(end);
    const shortStartTime = shortStart ? parseTime(shortStart) : null;
    const shortEndTime = shortEnd ? parseTime(shortEnd) : null;

    let totalHours = endTime - startTime;

    if (shortStartTime && shortEndTime) {
      totalHours -= shortEndTime - shortStartTime;
    }

    return totalHours > 0 ? totalHours : 0;
  };

  const parseTime = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(":").map(Number);
    return hours + minutes / 60;
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  return (
    <div className="schedule-container">
      <h1>Grafic de lucru</h1>
      <div className="week-navigation">
        <button onClick={goToPreviousWeek}>Saptamana Trecuta</button>
        <span>
          Saptamana {format(currentWeekStart, "dd.MM.yyyy")} - {format(addDays(currentWeekStart, 6), "dd.MM.yyyy")}
        </span>
        <button onClick={goToNextWeek}>Saptamana viitoare</button>
      </div>
      <table className="schedule-table">
        <thead>
          <tr>
            <th>Angajat</th>
            {getWeekDays().map((day, index) => (
              <th key={index}>{format(day, "EEEE, dd.MM")}</th>
            ))}
            <th>Ore de lucru</th>
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
              <td>{employee.shifts.reduce((total, shift) => total + calculateWorkedHours(shift), 0).toFixed(2)} ч.</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedEmployee !== null && selectedDay !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Schimba orar</h3>
              <button
                className="close-button"
                onClick={() => {
                  setSelectedEmployee(null);
                  setSelectedDay(null);
                  setStartTime("");
                  setEndTime("");
                  setShortStartTime("");
                  setShortEndTime("");
                  setIsShortTimeEnabled(false);
                }}
              >
                ×
              </button>
            </div>
            <p>
              {schedule[selectedEmployee].name},{" "}
              {format(getWeekDays()[selectedDay], "EEEE, dd.MM")}
            </p>
            <div className="time-inputs">
              <div className="time-work">
                <label>
                  Start work-time
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </label>
                <label>
                  End work-time
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </label>
              </div>
              <div className="label-short-time">
                Short-time?
                <input
                  type="checkbox"
                  checked={isShortTimeEnabled}
                  onChange={(e) => setIsShortTimeEnabled(e.target.checked)}
                />
              </div>
              {isShortTimeEnabled && (
                <>
                  <div className="short-time">
                    <label>
                      Start short-time
                      <input
                        type="time"
                        value={shortStartTime}
                        onChange={(e) => setShortStartTime(e.target.value)}
                      />
                    </label>
                    <label>
                      End short-time
                      <input
                        type="time"
                        value={shortEndTime}
                        onChange={(e) => setShortEndTime(e.target.value)}
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="save-button" onClick={saveShift}>
                Save
              </button>
              <button
                className="cancel-button"
                onClick={() => {
                  setSelectedEmployee(null);
                  setSelectedDay(null);
                  setStartTime("");
                  setEndTime("");
                  setShortStartTime("");
                  setShortEndTime("");
                  setIsShortTimeEnabled(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleComponent;