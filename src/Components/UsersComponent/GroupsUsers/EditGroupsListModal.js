import { useEffect, useState } from "react";
import {
    Modal,
    Button,
    TextInput,
    Stack,
    Flex,
    Paper,
    Text,
    Select,
    MultiSelect,
    Collapse,
    Loader,
} from "@mantine/core";
import { IoTrash } from "react-icons/io5";
import { api } from "../../../api";
import { translations } from "../../utils/translations";
import { useConfirmPopup } from "../../../hooks";
import { useSnackbar } from "notistack";
import { useGetTechniciansList } from "../../../hooks";

const language = localStorage.getItem("language") || "RO";

const EditGroupsListModal = ({ opened, onClose }) => {
    const [groups, setGroups] = useState([]);
    const [newGroup, setNewGroup] = useState("");
    const [expandedGroupId, setExpandedGroupId] = useState(null);
    const [groupState, setGroupState] = useState({});
    const [loading, setLoading] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const confirmDelete = useConfirmPopup({
        subTitle: translations["Sigur doriți să ștergeți acest grup?"][language],
    });

    const { technicians } = useGetTechniciansList();

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const data = await api.user.getGroupsList();
            setGroups(data.sort((a, b) => a.name.localeCompare(b.name)));

            const initialState = {};
            data.forEach((group) => {
                initialState[group.id] = {
                    supervisor_id: group.supervisor_id?.toString() || null,
                    user_ids: group.users?.map(String) || [],
                };
            });
            setGroupState(initialState);
        } catch (err) {
            enqueueSnackbar(translations["Eroare la încărcarea grupurilor"][language], {
                variant: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        const trimmed = newGroup.trim();
        if (trimmed && !groups.find((g) => g.name === trimmed)) {
            try {
                const created = await api.user.createGroup({ group_name: trimmed });
                setGroups((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
                setNewGroup("");
                enqueueSnackbar(translations["Grup adăugat cu succes"][language], {
                    variant: "success",
                });
            } catch (err) {
                enqueueSnackbar(translations["Eroare la crearea grupului"][language], {
                    variant: "error",
                });
            }
        }
    };

    const handleDelete = async (groupId) => {
        confirmDelete(async () => {
            try {
                await api.user.deleteGroups(groupId);
                setGroups((prev) => prev.filter((g) => g.id !== groupId));
                enqueueSnackbar(translations["Grup șters cu succes"][language], {
                    variant: "success",
                });
            } catch (err) {
                enqueueSnackbar(translations["Eroare la ștergerea grupului"][language], {
                    variant: "error",
                });
            }
        });
    };

    const handleGroupToggle = (groupId) => {
        setExpandedGroupId((prev) => (prev === groupId ? null : groupId));
    };

    const handleSave = async (groupId, groupName) => {
        const current = groupState[groupId];
        if (!groupName || !current.supervisor_id || !current.user_ids.length) {
            enqueueSnackbar(translations["Completați toate câmpurile obligatorii"][language], {
                variant: "warning",
            });
            return;
        }

        try {
            await api.user.updateGroupByName({
                group_name: groupName,
                supervisor_id: Number(current.supervisor_id),
                user_ids: current.user_ids.map(Number),
            });

            enqueueSnackbar(translations["Grup actualizat cu succes"][language], {
                variant: "success",
            });

            fetchGroups();
        } catch (err) {
            enqueueSnackbar(translations["Eroare la actualizarea grupului"][language], {
                variant: "error",
            });
        }
    };

    useEffect(() => {
        if (opened) {
            fetchGroups();
        } else {
            setGroups([]);
            setNewGroup("");
            setExpandedGroupId(null);
            setGroupState({});
        }
    }, [opened]);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={translations["Editează grupurile"][language]}
            size="md"
        >
            <Stack>
                <Flex gap="sm">
                    <TextInput
                        placeholder={translations["Grup nou"][language]}
                        value={newGroup}
                        onChange={(e) => setNewGroup(e.target.value)}
                        style={{ flex: 1 }}
                        disabled={loading}
                    />
                    <Button
                        onClick={handleAdd}
                        disabled={loading || !newGroup.trim() || groups.some(g => g.name === newGroup.trim())}
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
                        <Paper key={group.id} withBorder p="sm" radius="md">
                            <Flex
                                justify="space-between"
                                align="center"
                                onClick={() => handleGroupToggle(group.id)}
                                className="pointer"
                            >
                                <Text>{group.name}</Text>
                                <IoTrash
                                    color="red"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(group.id);
                                    }}
                                />
                            </Flex>

                            <Collapse in={expandedGroupId === group.id}>
                                <Stack mt="sm">
                                    <Select
                                        label={translations["Team Lead"][language]}
                                        placeholder={translations["Selectați Team Lead"][language]}
                                        data={technicians}
                                        value={groupState[group.id]?.supervisor_id || null}
                                        onChange={(val) =>
                                            setGroupState((prev) => ({
                                                ...prev,
                                                [group.id]: {
                                                    ...prev[group.id],
                                                    supervisor_id: val || null,
                                                },
                                            }))
                                        }
                                        searchable
                                        clearable
                                        disabled={loading}
                                    />
                                    <MultiSelect
                                        label={translations["Selectează operator"][language]}
                                        placeholder={translations["Selectează operator"][language]}
                                        data={technicians}
                                        value={groupState[group.id]?.user_ids || []}
                                        onChange={(val) =>
                                            setGroupState((prev) => ({
                                                ...prev,
                                                [group.id]: {
                                                    ...prev[group.id],
                                                    user_ids: val,
                                                },
                                            }))
                                        }
                                        searchable
                                        clearable
                                        disabled={loading}
                                    />
                                    <Button onClick={() => handleSave(group.id, group.name)} disabled={loading}>
                                        {translations["Salvează"][language]}
                                    </Button>
                                </Stack>
                            </Collapse>
                        </Paper>
                    ))}
            </Stack>
        </Modal>
    );
};

export default EditGroupsListModal;
