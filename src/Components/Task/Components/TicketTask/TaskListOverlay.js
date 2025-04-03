import { Drawer } from "@mantine/core"
import TaskComponent from "../../Page/TaskComponent"

const TaskListOverlay = ({
  ticketId,
  userId,
  open,
  onCloseDrawer,
  fetchTaskCount
}) => {
  return (
    <Drawer
      opened={open}
      onClose={onCloseDrawer}
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
  )
}

export default TaskListOverlay
