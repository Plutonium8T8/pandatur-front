import { Modal, Select, Button, Stack } from "@mantine/core";
import { useState } from "react";
import { groupUsersOptions } from "./GroupUsersOptions";
import { translations } from "../../utils/translations";

const language = localStorage.getItem("language") || "RO";

const GroupChangeModal = ({ opened, onClose, onConfirm }) => {
  const [group, setGroup] = useState("");

  const handleConfirm = () => {
    if (group) {
      onConfirm(group);
      setGroup("");
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={translations["Schimbă grupul"][language]}
      centered
    >
      <Stack>
        <Select
          label={translations["Alege grupul"][language]}
          placeholder={translations["Alege grupul"][language]}
          data={groupUsersOptions.map((g) => ({ value: g, label: g }))}
          value={group}
          onChange={setGroup}
        />

        <Button onClick={handleConfirm} disabled={!group}>
          {translations["Confirma"][language]}
        </Button>
      </Stack>
    </Modal>
  );
};

export default GroupChangeModal;
