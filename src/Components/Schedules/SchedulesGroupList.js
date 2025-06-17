import React, { useEffect, useState } from "react";
import {
  Card,
  Text,
  Stack,
  Button,
  Group,
  Badge,
  Avatar,
  Tooltip,
  ActionIcon,
  ScrollArea,
} from "@mantine/core";
import { groupSchedules } from "../../api/groupSchedules";
import ScheduleView from "./ScheduleView";
import { useSnackbar } from "notistack";
import { FaTrash, FaEdit } from "react-icons/fa";
import { translations } from "../utils/translations";
import ModalGroup from "./ModalGroup";
import { useConfirmPopup, useGetTechniciansList } from "../../hooks";
import Can from "../CanComponent/Can";

const language = localStorage.getItem("language") || "RO";

const SchedulesGroupList = ({ reload, setInGroupView }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editOpened, setEditOpened] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const confirmDelete = useConfirmPopup({ loading: false });

  const { technicians } = useGetTechniciansList();

  const fetchData = async () => {
    try {
      const groupData = await groupSchedules.getAllGroups();

      const formattedGroups = groupData.map((group) => ({
        id: group.id,
        name: group.name,
        user_ids: group.user_ids,
        supervisor_id: group.supervisor_id,
      }));

      setGroups(formattedGroups);
    } catch (err) {
      enqueueSnackbar(translations["Eroare la încărcare"][language], {
        variant: "error",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [reload]);

  const handleGroupClick = async (group) => {
    try {
      const usersInGroup = await groupSchedules.getTechniciansInGroup(group.id);

      const fullGroup = {
        ...group,
        user_ids: usersInGroup.map((u) => u.id),
        supervisor_id: usersInGroup.find((u) => u.is_supervisor)?.id || null,
        users: usersInGroup,
      };

      setSelectedGroup(fullGroup);
      setInGroupView?.(true);
    } catch (err) {
      enqueueSnackbar("Eroare la încărcare utilizatori grup", { variant: "error" });
    }
  };

  const handleBack = () => {
    setSelectedGroup(null);
    setInGroupView?.(false);
  };

  const handleClickDelete = (group) => {
    setEditingGroup(group);
    confirmDelete(() => handleDelete(group.id));
  };

  const handleDelete = async (id) => {
    try {
      await groupSchedules.deleteGroup(id);
      fetchData();
      enqueueSnackbar(translations["Grupul a fost șters"][language], {
        variant: "success",
      });
    } catch (err) {
      enqueueSnackbar(translations["Eroare la ștergere"][language], {
        variant: "error",
      });
    }
  };

  const handleEdit = async (group) => {
    const usersInGroup = await groupSchedules.getTechniciansInGroup(group.id);

    setEditingGroup({
      ...group,
      user_ids: usersInGroup.map((u) => u.id),
      supervisor_id: usersInGroup.find((u) => u.is_supervisor)?.id || null,
    });
    setEditOpened(true);
  };

  const handleGroupUpdate = async (updatedGroup) => {
    try {
      const usersInGroup = await groupSchedules.getTechniciansInGroup(updatedGroup.id);

      const updatedSelectedGroup = {
        ...updatedGroup,
        user_ids: usersInGroup.map((u) => u.id),
      };

      setSelectedGroup(updatedSelectedGroup);
      fetchData();
    } catch (err) {
      enqueueSnackbar(translations["Eroare la actualizarea grupului"][language], {
        variant: "error",
      });
    }
  };

  if (selectedGroup) {
    return (
      <div>
        <Button onClick={handleBack} mb="md">
          ← {translations["Înapoi la grupuri"][language]}
        </Button>
        <ScheduleView
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
          groupUsers={technicians.filter((t) =>
            selectedGroup.user_ids.includes(t.id)
          )}
          onGroupUpdate={handleGroupUpdate}
        />
      </div>
    );
  }

  return (
    <>
      <ScrollArea h="90vh" type="auto">
        <Stack spacing="md">
          {groups.map((group) => {
            const groupUsers = technicians.filter((u) =>
              group.user_ids.includes(u.id)
            );

            return (
              <Card
                key={group.id}
                shadow="xs"
                padding="lg"
                radius="md"
                withBorder
                className="group-card"
              >
                <Group position="apart" align="start">
                  <div
                    style={{ flex: 1, cursor: "pointer" }}
                    onClick={() => handleGroupClick(group)}
                  >
                    <Group spacing="xs" mb={10}>
                      <Text size="md" fw={600}>
                        {group.name}
                      </Text>
                      <Badge color="blue" variant="light">
                        {translations["Pentru o săptămână"][language]}
                      </Badge>
                    </Group>

                    <Tooltip.Group openDelay={300} closeDelay={100}>
                      <Avatar.Group spacing="sm">
                        {groupUsers.slice(0, 5).map((u) => (
                          <Tooltip label={u.username} withArrow key={u.id}>
                            <Avatar
                              size="md"
                              radius="xl"
                              src={u.photo || undefined}
                              color="blue"
                            >
                              {u.username?.[0]?.toUpperCase() || "?"}
                            </Avatar>
                          </Tooltip>
                        ))}
                        {groupUsers.length > 5 && (
                          <Tooltip
                            withArrow
                            label={
                              <>
                                {groupUsers.slice(5).map((u) => (
                                  <div key={u.id}>{u.username}</div>
                                ))}
                              </>
                            }
                          >
                            <Avatar size="md" radius="xl" color="blue">
                              +{groupUsers.length - 5}
                            </Avatar>
                          </Tooltip>
                        )}
                      </Avatar.Group>
                    </Tooltip.Group>
                  </div>

                  <Group>
                    <Can
                      permission={{ module: "schedules", action: "edit" }}
                      context={{ responsibleId: group.supervisor_id }}
                    >
                      <ActionIcon
                        color="blue"
                        variant="light"
                        onClick={() => handleEdit(group)}
                      >
                        <FaEdit />
                      </ActionIcon>
                    </Can>

                    <Can
                      permission={{ module: "schedules", action: "delete" }}
                      context={{ responsibleId: group.supervisor_id }}
                    >
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => handleClickDelete(group)}
                      >
                        <FaTrash />
                      </ActionIcon>
                    </Can>
                  </Group>
                </Group>
              </Card>
            );
          })}
        </Stack>
      </ScrollArea>

      <ModalGroup
        opened={editOpened}
        onClose={() => setEditOpened(false)}
        onGroupCreated={fetchData}
        initialData={editingGroup}
        isEditMode
      />
    </>
  );
};

export default SchedulesGroupList;
