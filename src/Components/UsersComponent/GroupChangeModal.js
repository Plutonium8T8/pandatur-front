import { Modal, Select, Button, Stack } from "@mantine/core"
import { useState } from "react"
import { GroupUsersOptions } from "./GroupUsersOptions"

const GroupChangeModal = ({ opened, onClose, onConfirm }) => {
  const [group, setGroup] = useState("")

  const handleConfirm = () => {
    if (group) {
      onConfirm(group)
      setGroup("")
      onClose()
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Schimbați grupul" centered>
      <Stack>
        <Select
          label="Alegeți un grup"
          placeholder="Selectați grupul"
          data={GroupUsersOptions.map((g) => ({ value: g, label: g }))}
          value={group}
          onChange={setGroup}
        />

        <Button onClick={handleConfirm} disabled={!group}>
          Confirmați
        </Button>
      </Stack>
    </Modal>
  )
}

export default GroupChangeModal
