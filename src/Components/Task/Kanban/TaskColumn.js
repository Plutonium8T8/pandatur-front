import React from "react";
import dayjs from "dayjs";
import TaskCard from "./TaskCard";
import { translations } from "../../utils/translations";
import "./TaskKanban.css";

// Универсальная функция парсинга даты
const parseTaskDate = (dateString) => {
  if (!dateString) return null;
  
  // Пробуем разные форматы
  let parsed = dayjs(dateString);
  if (parsed.isValid()) return parsed;
  
  // Пробуем формат DD-MM-YYYY HH:mm:ss
  parsed = dayjs(dateString, "DD-MM-YYYY HH:mm:ss");
  if (parsed.isValid()) return parsed;
  
  // Пробуем формат YYYY-MM-DD HH:mm:ss
  parsed = dayjs(dateString, "YYYY-MM-DD HH:mm:ss");
  if (parsed.isValid()) return parsed;
  
  // Пробуем ISO формат
  parsed = dayjs(dateString, "YYYY-MM-DDTHH:mm:ss");
  if (parsed.isValid()) return parsed;
  
  return null;
};

const language = localStorage.getItem("language") || "RO";

const TaskColumn = ({ titleKey, tasksList, now, onEdit, columnType }) => {
    const getColumnConfig = (key) => {
        const configs = {
            overdue: { icon: "⚠️", title: "Просроченные" },
            today: { icon: "📅", title: "Сегодня" },
            tomorrow: { icon: "⏰", title: "Завтра" }
        };
        return configs[key] || { icon: "📋", title: "Задачи" };
    };

    const config = getColumnConfig(columnType);

    return (
        <div className={`task-column ${columnType}`}>
            {/* Заголовок колонки */}
            <div className="task-column-header">
                <h3 className="task-column-title">
                    {config.icon} {translations[titleKey][language]}
                    <span className="task-count">
                        {tasksList.length}
                    </span>
                </h3>
            </div>

            {/* Список задач */}
            <div style={{ flex: 1, overflowY: "auto" }}>
                {tasksList.length === 0 ? (
                    <div className="task-empty">
                        {translations["noTasks"][language]}
                    </div>
                ) : (
                    tasksList.map((task) => {
                        const deadline = parseTaskDate(task.scheduled_time);
                        if (!deadline || !deadline.isValid()) {
                            console.log("Не удалось распарсить дату в TaskColumn:", task.id, task.scheduled_time);
                            return null;
                        }
                        return (
                            <TaskCard
                                key={task.id}
                                task={task}
                                deadline={deadline}
                                now={now}
                                onClick={onEdit}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default TaskColumn;