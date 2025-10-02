import React from "react";
import { TypeTask } from "../OptionsTaskType";
import { Link } from "react-router-dom";
import { FaFingerprint } from "react-icons/fa6";
import "./TaskKanban.css";

const TaskCard = ({ task, deadline, now, onClick }) => {
    const taskTypeObj = TypeTask.find((t) => t.name === task.task_type);
    const isOverdue = deadline.isBefore(now, "day");
    const isToday = deadline.isSame(now, "day");
    const isTomorrow = deadline.isSame(now.add(1, "day"), "day");

    const getCardClass = () => {
        if (isOverdue) return "task-card task-card-overdue";
        if (isToday) return "task-card task-card-today";
        if (isTomorrow) return "task-card task-card-tomorrow";
        return "task-card";
    };

    return (
        <div className={getCardClass()} onClick={() => onClick(task)}>
            {/* Header with Ticket ID and Time */}
            <div className="task-card-header">
                <Link
                    to={`/tasks/${task.ticket_id}`}
                    className="task-id"
                    onClick={(e) => e.stopPropagation()}
                >
                    <FaFingerprint size={12} style={{ marginRight: "4px" }} />
                    #{task.ticket_id}
                </Link>
                <div className="task-time">
                    {deadline.format("DD.MM HH:mm")}
                </div>
            </div>

            {/* Task Type */}
            <div className="task-type">
                <span className="task-type-icon">
                    {taskTypeObj?.icon}
                </span>
                <span className="task-type-text">
                    {task.task_type}
                </span>
            </div>

            {/* Description */}
            {task.description && (
                <div className="task-description">
                    {task.description}
                </div>
            )}

            {/* Users */}
            <div className="task-users">
                <span>{task.creator_by_full_name}</span>
                <span>→</span>
                <span>{task.created_for_full_name}</span>
            </div>
        </div>
    );
};

export default TaskCard;