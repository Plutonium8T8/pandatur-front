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
import { api } from "../../api";
import ScheduleView from "./ScheduleView";
import { useSnackbar } from "notistack";
import { FaTrash, FaEdit } from "react-icons/fa";
import { translations } from "../utils/translations";
import ModalGroup from "./ModalGroup";
import { useConfirmPopup } from "../../hooks";

const language = localStorage.getItem("language") || "RO";

const SchedulesGroupList = ({ reload, setInGroupView }) => {
  const [groups, setGroups] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editOpened, setEditOpened] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const confirmDelete = useConfirmPopup({ loading: false });

  const fetchData = async () => {
    try {
      const [groupData, userData] = await Promise.all([
        groupSchedules.getAllGroups(),
        api.users.getTechnicianList(),
      ]);

      const users = userData.map((item) => ({
        id: item.id.id,
        username: item.id.user?.username || "N/A",
        photo: item.id.photo,
      }));
      setTechnicians(users);

      const formattedGroups = groupData.map((group) => ({
        id: group.id,
        name: group.name,
        user_ids: group.user_ids,
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

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setInGroupView?.(true);
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

  const handleEdit = (group) => {
    setEditingGroup(group);
    setEditOpened(true);
  };

  const handleGroupUpdate = async (updatedGroup) => {
    try {
      const usersInGroup = await groupSchedules.getTechniciansInGroup(
        updatedGroup.id,
      );

      const updatedSelectedGroup = {
        ...updatedGroup,
        user_ids: usersInGroup.map((u) => u.id),
      };

      setSelectedGroup(updatedSelectedGroup);
      fetchData();
    } catch (err) {
      enqueueSnackbar(
        translations["Eroare la actualizarea grupului"][language],
        {
          variant: "error",
        },
      );
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
            selectedGroup.user_ids.includes(t.id),
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
              group.user_ids.includes(u.id),
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
                    <ActionIcon
                      color="blue"
                      variant="light"
                      onClick={() => handleEdit(group)}
                    >
                      <FaEdit />
                    </ActionIcon>
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => handleClickDelete(group)}
                    >
                      <FaTrash />
                    </ActionIcon>
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
