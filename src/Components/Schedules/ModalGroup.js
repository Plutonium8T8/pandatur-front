import React, { useEffect, useState } from "react";
import {
  Drawer,
  TextInput,
  MultiSelect,
  Button,
  Group,
  Loader,
} from "@mantine/core";
import { translations } from "../utils/translations";
import { useSnackbar } from "notistack";
import { useGetTechniciansList } from "../../hooks";
import { api } from "../../api";

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
  const { technicians, loading } = useGetTechniciansList();
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async () => {
    if (!groupName.trim() || selectedUserIds.length === 0) {
      enqueueSnackbar(
        translations["Completați toate câmpurile obligatorii"][language],
        { variant: "warning" },
      );
      return;
    }

    try {
      if (isEditMode && initialData?.id) {
        const groupId = initialData.id;

        await api.groupSchedules.updateGroup(groupId, { name: groupName });

        const currentUserIds = initialData.user_ids || [];
        const newUserIds = selectedUserIds.map((id) => parseInt(id));

        const usersToAdd = newUserIds.filter(
          (id) => !currentUserIds.includes(id),
        );
        const usersToRemove = currentUserIds.filter(
          (id) => !newUserIds.includes(id),
        );

        if (usersToAdd.length > 0) {
          await api.groupSchedules.assignMultipleTechnicians(
            groupId,
            usersToAdd,
          );
        }

        for (const userId of usersToRemove) {
          await api.groupSchedules.removeTechnician(groupId, userId);
        }

        const updatedGroup = await api.groupSchedules.getGroupById(groupId);
        onGroupCreated(updatedGroup);
      } else {
        await api.groupSchedules.createGroup({
          name: groupName,
          user_ids: selectedUserIds.map((id) => parseInt(id)),
        });
        onGroupCreated();
      }

      onClose();
      setGroupName("");
      setSelectedUserIds([]);
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
        setSelectedUserIds(
          initialData.user_ids?.map((id) => id.toString()) || [],
        );
      } else {
        setGroupName("");
        setSelectedUserIds([]);
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
      <MultiSelect
        data={technicians}
        label={translations["Utilizatori"][language]}
        placeholder={translations["Selectează utilizator"][language]}
        value={selectedUserIds}
        onChange={setSelectedUserIds}
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
