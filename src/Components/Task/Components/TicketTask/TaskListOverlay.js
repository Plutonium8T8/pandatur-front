import { useState, useEffect } from "react"
import { Drawer, Button } from "@mantine/core"
import TaskComponent from "../../Page/TaskComponent"
import { translations } from "../../../utils/translations"
import { api } from "../../../../api"

const TaskListOverlay = ({ ticketId, userId }) => {
  const [opened, setOpened] = useState(false)
  const [taskCount, setTaskCount] = useState(null)
  const language = localStorage.getItem("language") || "RO"

  const fetchTaskCount = async () => {
    try {
      if (ticketId) {
        const tasks = await api.task.getTaskByTicket(ticketId)
        setTaskCount(tasks.length)
      } else {
        setTaskCount(0)
      }
    } catch (error) {
      console.error(error)
      setTaskCount(0)
    }
  }

  useEffect(() => {
    fetchTaskCount()
  }, [ticketId])

  return (
    <>
      <Button
        fullWidth
        color={taskCount > 0 ? "blue" : "gray"}
        onClick={() => setOpened(true)}
      >
        {taskCount > 0
          ? `${translations["Задачи"][language]}: ${taskCount}`
          : translations["Нет задач, создать?"][language]}
      </Button>

      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        position="bottom"
        padding="md"
        size="lg"
      >
        <TaskComponent
          selectTicketId={ticketId}
          userId={userId}
          updateTaskCount={fetchTaskCount}
        />
      </Drawer>
    </>
  )
}

export default TaskListOverlay
