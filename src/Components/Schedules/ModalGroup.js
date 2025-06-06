import React, { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  TextInput,
  MultiSelect,
  Button,
  Group,
  Loader,
  Select,
} from "@mantine/core";
import { translations } from "../utils/translations";
import { useSnackbar } from "notistack";
import { useGetTechniciansList } from "../../hooks";
import { api } from "../../api";
import {
  formatMultiSelectData,
  getGroupUserMap,
} from "../utils/multiSelectUtils";

const language = localStorage.getItem("language") || "RO";

const ModalGroup = ({
  opened,
  onClose,
  onGroupCreated,
  initialData = null,
  isEditMode = false,
}) => {
  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const { technicians, loading } = useGetTechniciansList();
  const { enqueueSnackbar } = useSnackbar();

  const formattedTechnicians = useMemo(
    () => formatMultiSelectData(technicians),
    [technicians]
  );

  const groupUserMap = useMemo(() => getGroupUserMap(technicians), [technicians]);

  const handleUserChange = (val) => {
    const last = val[val.length - 1];
    const isGroup = last?.startsWith("__group__");

    if (isGroup) {
      const groupUsers = groupUserMap.get(last) || [];
      const unique = Array.from(new Set([...selectedUserIds, ...groupUsers]));
      setSelectedUserIds(unique);
    } else {
      setSelectedUserIds(val);
    }
  };

  const handleSubmit = async () => {
    if (!groupName.trim() || selectedUserIds.length === 0 || !selectedSupervisor) {
      enqueueSnackbar(
        translations["Completați toate câmpurile obligatorii"][language],
        { variant: "warning" }
      );
      return;
    }

    try {
      const payload = {
        name: groupName,
        user_ids: selectedUserIds.map((id) => parseInt(id)),
        supervisor_id: parseInt(selectedSupervisor),
      };

      if (isEditMode && initialData?.id) {
        const groupId = initialData.id;
        await api.groupSchedules.updateGroup(groupId, payload);

        const currentUserIds = initialData.user_ids || [];
        const newUserIds = payload.user_ids;

        const usersToAdd = newUserIds.filter((id) => !currentUserIds.includes(id));
        const usersToRemove = currentUserIds.filter((id) => !newUserIds.includes(id));

        if (usersToAdd.length > 0) {
          await api.groupSchedules.assignMultipleTechnicians(groupId, usersToAdd);
        }

        for (const userId of usersToRemove) {
          await api.groupSchedules.removeTechnician(groupId, userId);
        }

        const updatedGroup = await api.groupSchedules.getGroupById(groupId);
        onGroupCreated(updatedGroup);
      } else {
        await api.groupSchedules.createGroup(payload);
        onGroupCreated();
      }

      onClose();
      setGroupName("");
      setSelectedUserIds([]);
      setSelectedSupervisor(null);
    } catch (err) {
      enqueueSnackbar(translations["Eroare la salvarea grupului"][language], {
        variant: "error",
      });
    }
  };

  useEffect(() => {
    if (opened) {
      if (isEditMode && initialData) {
        setGroupName(initialData.name || "");
        setSelectedUserIds(initialData.user_ids?.map((id) => id.toString()) || []);
        setSelectedSupervisor(initialData.supervisor_id?.toString() || null);
      } else {
        setGroupName("");
        setSelectedUserIds([]);
        setSelectedSupervisor(null);
      }
    }
  }, [opened, initialData, isEditMode]);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        isEditMode
          ? translations["Modifică grup"][language]
          : translations["Adaugă grup"][language]
      }
      position="right"
      padding="md"
      size="md"
    >
      <TextInput
        label={translations["Nume grup"][language]}
        placeholder={translations["Nume grup"][language]}
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        mb="md"
      />
      <Select
        label={translations["Team Lead"][language]}
        placeholder={translations["Team Lead"][language]}
        data={technicians}
        value={selectedSupervisor}
        onChange={setSelectedSupervisor}
        searchable
        clearable
        rightSection={loading && <Loader size="xs" />}
        mb="md"
      />
      <MultiSelect
        data={formattedTechnicians}
        label={translations["Utilizatori"][language]}
        placeholder={translations["Selectează utilizator"][language]}
        value={selectedUserIds}
        onChange={handleUserChange}
        searchable
        rightSection={loading && <Loader size="xs" />}
      />
      <Group mt="md" position="right">
        <Button onClick={handleSubmit}>
          {isEditMode
            ? translations["Salvează"][language]
            : translations["Creează"][language]}
        </Button>
      </Group>
    </Drawer>
  );
};

export default ModalGroup;
