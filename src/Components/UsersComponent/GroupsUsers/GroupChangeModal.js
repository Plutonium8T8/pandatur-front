import { Modal, Select, Button, Stack } from "@mantine/core";
import { useEffect, useState } from "react";
import { api } from "../../../api";
import { translations } from "../../utils/translations";

const language = localStorage.getItem("language") || "RO";

const GroupChangeModal = ({ opened, onClose, onConfirm }) => {
  const [group, setGroup] = useState("");
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await api.user.getGroupsList();
        setGroups(data);
      } catch (err) {
        console.error("error fetch roles", err);
      }
    };

    if (opened) {
      fetchGroups();
    }
  }, [opened]);

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
          data={groups.map((groups) => ({ value: groups.name, label: groups.name }))}
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
