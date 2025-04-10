import { Modal, Select, Button, Stack, Loader } from "@mantine/core";
import { useEffect, useState } from "react";
import { api } from "../../../api";
import { translations } from "../../utils/translations";
import { useSnackbar } from "notistack";

const language = localStorage.getItem("language") || "RO";

const GroupChangeModal = ({ opened, onClose, onConfirm }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [group, setGroup] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const data = await api.user.getGroupsList();
        setGroups(data);
      } catch (err) {
        console.error("error fetch groups", err);
        enqueueSnackbar(
          translations["Eroare la încărcarea grupurilor de utilizatori"][language],
          { variant: "error" }
        );
      } finally {
        setLoading(false);
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
          data={groups.map((g) => ({ value: g.name, label: g.name }))}
          value={group}
          onChange={setGroup}
          rightSection={loading ? <Loader size={16} /> : null}
          disabled={loading}
        />

        <Button onClick={handleConfirm} disabled={!group || loading} loading={loading}>
          {translations["Confirma"][language]}
        </Button>
      </Stack>
    </Modal>
  );
};

export default GroupChangeModal;
