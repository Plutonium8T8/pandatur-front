import { useEffect, useState, useMemo, useCallback, memo, startTransition } from "react";
import {
    Modal,
    Button,
    TextInput,
    Stack,
    Flex,
    Paper,
    Text,
    Collapse,
    Loader,
} from "@mantine/core";
import { IoTrash } from "react-icons/io5";
import { api } from "../../../api";
import { translations } from "../../utils/translations";
import { useConfirmPopup, useGetTechniciansList } from "../../../hooks";
import { useSnackbar } from "notistack";
import {
    formatMultiSelectData,
} from "../../utils/multiSelectUtils";
import { UserGroupMultiSelect } from "../../ChatComponent/components/UserGroupMultiSelect/UserGroupMultiSelect";

const language = localStorage.getItem("language") || "RO";

// Оптимизированный компонент строки группы
const GroupItem = memo(({ 
    group, 
    isExpanded, 
    formattedTechnicians,
    onToggle, 
    onDelete, 
    onSave,
    loading 
}) => {
    // Локальное состояние для редактируемых полей
    const [editableName, setEditableName] = useState(group.name || "");
    const [supervisorId, setSupervisorId] = useState(group.supervisor_id ? [group.supervisor_id.toString()] : []);
    const [userIds, setUserIds] = useState(group.users?.map(String) || []);

    // Обработчик сохранения с передачей данных наружу
    const handleSave = useCallback(() => {
        onSave(group.id, {
            editableName,
            supervisor_id: supervisorId[0] || null, // Берем первый элемент массива
            user_ids: userIds
        });
    }, [group.id, editableName, supervisorId, userIds, onSave]);

    // Обработчик удаления
    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        onDelete(group.id);
    }, [group.id, onDelete]);

    // Обработчик переключения раскрытия
    const handleToggle = useCallback(() => {
        onToggle(group.id);
    }, [group.id, onToggle]);

    // Обработчик изменения имени с startTransition
    const handleNameChange = useCallback((e) => {
        const value = e.target.value;
        startTransition(() => {
            setEditableName(value);
        });
    }, []);

    // Обработчик изменения supervisor (теперь массив)
    const handleSupervisorChange = useCallback((val) => {
        setSupervisorId(val || []);
    }, []);

    // Обработчик изменения users
    const handleUsersChange = useCallback((val) => {
        setUserIds(val);
    }, []);

    return (
        <Paper withBorder p="sm" radius="md">
            <Flex 
                justify="space-between" 
                align="center" 
                onClick={handleToggle} 
                className="pointer"
                style={{ cursor: 'pointer' }}
            >
                <Text>{group.name}</Text>
                <IoTrash
                    color="red"
                    onClick={handleDelete}
                    style={{ cursor: 'pointer' }}
                />
            </Flex>

            {isExpanded && (
                <Collapse in={isExpanded}>
                    <Stack mt="sm">
                        <TextInput
                            label={translations["Nume grup"][language]}
                            placeholder={translations["Nume grup"][language]}
                            value={editableName}
                            onChange={handleNameChange}
                            disabled={loading}
                        />
                        <UserGroupMultiSelect
                            label={translations["Team Lead"][language]}
                            placeholder={translations["Selectați Team Lead"][language]}
                            value={supervisorId}
                            onChange={handleSupervisorChange}
                            techniciansData={formattedTechnicians}
                            mode="single"
                            disabled={loading}
                        />
                        <UserGroupMultiSelect
                            label={translations["Selectează operator"][language]}
                            placeholder={translations["Selectează operator"][language]}
                            value={userIds}
                            onChange={handleUsersChange}
                            techniciansData={formattedTechnicians}
                            mode="multi"
                            disabled={loading}
                        />
                        <Button 
                            onClick={handleSave} 
                            disabled={loading || !editableName.trim()}
                        >
                            {translations["Salvează"][language]}
                        </Button>
                    </Stack>
                </Collapse>
            )}
        </Paper>
    );
});

GroupItem.displayName = 'GroupItem';

const EditGroupsListModal = ({ opened, onClose }) => {
    const [groups, setGroups] = useState([]);
    const [newGroup, setNewGroup] = useState("");
    const [expandedGroupId, setExpandedGroupId] = useState(null);
    const [loading, setLoading] = useState(false);

    const { enqueueSnackbar } = useSnackbar();
    const confirmDelete = useConfirmPopup({
        subTitle: translations["Sigur doriți să ștergeți acest grup?"][language],
    });

    const { technicians } = useGetTechniciansList();
    const formattedTechnicians = useMemo(() => formatMultiSelectData(technicians), [technicians]);

    const fetchGroups = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.user.getGroupsList();
            setGroups(data.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err) {
            enqueueSnackbar(translations["Eroare la încărcarea grupurilor"][language], {
                variant: "error",
            });
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    const handleAdd = useCallback(async () => {
        const trimmed = newGroup.trim();
        if (trimmed && !groups.find((g) => g.name === trimmed)) {
            try {
                const created = await api.user.createGroup({ group_name: trimmed });
                // Оптимистическое обновление
                setGroups((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
                setNewGroup("");
                enqueueSnackbar(translations["Grup adăugat cu succes"][language], {
                    variant: "success",
                });
            } catch (err) {
                enqueueSnackbar(translations["Eroare la crearea grupului"][language], {
                    variant: "error",
                });
                // Откатываем изменения при ошибке
                fetchGroups();
            }
        }
    }, [newGroup, groups, enqueueSnackbar, fetchGroups]);

    const handleDelete = useCallback((groupId) => {
        confirmDelete(async () => {
            // Оптимистическое обновление
            const deletedGroup = groups.find(g => g.id === groupId);
            setGroups((prev) => prev.filter((g) => g.id !== groupId));
            
            try {
                await api.user.deleteGroups(groupId);
                enqueueSnackbar(translations["Grup șters cu succes"][language], {
                    variant: "success",
                });
            } catch (err) {
                enqueueSnackbar(translations["Eroare la ștergerea grupului"][language], {
                    variant: "error",
                });
                // Откатываем изменения при ошибке
                if (deletedGroup) {
                    setGroups((prev) => [...prev, deletedGroup].sort((a, b) => a.name.localeCompare(b.name)));
                }
            }
        });
    }, [confirmDelete, groups, enqueueSnackbar]);

    const handleGroupToggle = useCallback((groupId) => {
        setExpandedGroupId((prev) => (prev === groupId ? null : groupId));
    }, []);

    const handleSave = useCallback(async (groupId, data) => {
        const { editableName, supervisor_id, user_ids } = data;
        
        if (!editableName?.trim()) {
            enqueueSnackbar(translations["Completați toate câmpurile obligatorii"][language], {
                variant: "warning",
            });
            return;
        }

        const payload = {
            group_id: groupId,
            group_name: editableName,
            user_ids: user_ids.map(Number),
        };

        if (supervisor_id) {
            payload.supervisor_id = Number(supervisor_id);
        }

        // Оптимистическое обновление
        const oldGroups = [...groups];
        setGroups((prev) => prev.map(g => 
            g.id === groupId 
                ? { ...g, name: editableName, supervisor_id, users: user_ids }
                : g
        ));

        try {
            await api.user.updateGroupData({ body: payload });
            enqueueSnackbar(translations["Grup actualizat cu succes"][language], {
                variant: "success",
            });
        } catch (err) {
            enqueueSnackbar(translations["Eroare la actualizarea grupului"][language], {
                variant: "error",
            });
            // Откатываем изменения при ошибке
            setGroups(oldGroups);
        }
    }, [groups, enqueueSnackbar]);

    useEffect(() => {
        if (opened) {
            fetchGroups();
        } else {
            setGroups([]);
            setNewGroup("");
            setExpandedGroupId(null);
        }
    }, [opened, fetchGroups]);

    // Обработчик изменения нового группы с startTransition
    const handleNewGroupChange = useCallback((e) => {
        const value = e.target.value;
        startTransition(() => {
            setNewGroup(value);
        });
    }, []);

    return (
        <Modal opened={opened} onClose={onClose} title={translations["Editează grupurile"][language]} size="md">
            <Stack>
                <Flex gap="sm">
                    <TextInput
                        placeholder={translations["Grup nou"][language]}
                        value={newGroup}
                        onChange={handleNewGroupChange}
                        style={{ flex: 1 }}
                        disabled={loading}
                    />
                    <Button
                        onClick={handleAdd}
                        disabled={loading || !newGroup.trim() || groups.some((g) => g.name === newGroup.trim())}
                    >
                        {translations["Adaugă"][language]}
                    </Button>
                </Flex>

                {loading && (
                    <Flex justify="center" py="md">
                        <Loader />
                    </Flex>
                )}

                {!loading && groups.length === 0 && (
                    <Text align="center">{translations["Nu există grupuri"][language]}</Text>
                )}

                {!loading &&
                    groups.map((group) => (
                        <GroupItem
                            key={group.id}
                            group={group}
                            isExpanded={expandedGroupId === group.id}
                            formattedTechnicians={formattedTechnicians}
                            onToggle={handleGroupToggle}
                            onDelete={handleDelete}
                            onSave={handleSave}
                            loading={loading}
                        />
                    ))}
            </Stack>
        </Modal>
    );
};

export default EditGroupsListModal;
