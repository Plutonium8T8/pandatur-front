import {
    Modal,
    TextInput,
    Button,
    Box,
    Text,
    Stack,
    Divider,
    Group,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { api } from "../../../api";
import { translations } from "../../utils/translations";
import { useSnackbar } from "notistack";
import RoleMatrix from "./RoleMatrix";

const language = localStorage.getItem("language") || "RO";

const CreatePermissionGroupModal = ({ opened, onClose }) => {
    const [groupName, setGroupName] = useState("");
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [existingGroups, setExistingGroups] = useState([]);
    const [editingGroupId, setEditingGroupId] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        if (opened) {
            fetchExistingGroups();
        } else {
            resetForm();
        }
    }, [opened]);

    const resetForm = () => {
        setGroupName("");
        setSelectedRoles([]);
        setEditingGroupId(null);
    };

    const fetchExistingGroups = async () => {
        try {
            const data = await api.users.getAllPermissionGroups();
            setExistingGroups(data);
        } catch (error) {
            enqueueSnackbar(
                translations["Eroare la încărcarea grupurilor existente"][language], {
                variant: "error",
            });
        }
    };

    const toggleRole = (role) => {
        setSelectedRoles((prev) =>
            prev.includes(role)
                ? prev.filter((r) => r !== role)
                : [...prev, role]
        );
    };

    const handleSubmit = async () => {
        if (!groupName || selectedRoles.length === 0) {
            enqueueSnackbar(
                translations["Completați toate câmpurile obligatorii"][language],
                { variant: "warning" }
            );
            return;
        }

        try {
            const payload = {
                name: groupName,
                roles: selectedRoles.map((r) => "ROLE_" + r),
            };

            if (editingGroupId) {
                await api.users.updatePermissionGroup(editingGroupId, payload);
                enqueueSnackbar(
                    translations["Grup de permisiuni actualizat cu succes"][language],
                    { variant: "success" }
                );
            } else {
                await api.users.createPermissionGroup(payload);
                enqueueSnackbar(
                    translations["Grup de permisiuni creat cu succes"][language],
                    { variant: "success" }
                );
            }

            fetchExistingGroups();
            resetForm();
        } catch (err) {
            enqueueSnackbar(
                translations["Eroare la salvarea grupului de permisiuni"][language],
                { variant: "error" }
            );
        }
    };

    const handleDelete = async () => {
        if (!editingGroupId) return;

        try {
            await api.users.deletePermissionGroup(editingGroupId);
            enqueueSnackbar(
                translations["Grup șters cu succes"][language],
                { variant: "success" }
            );
            fetchExistingGroups();
            resetForm();
        } catch (err) {
            enqueueSnackbar(
                translations["Eroare la ștergerea grupului"][language],
                { variant: "error" }
            );
        }
    };

    const formatRoles = (roles) => {
        if (Array.isArray(roles)) return roles;
        if (typeof roles === "object" && roles !== null)
            return Object.values(roles);
        return [];
    };

    const handleGroupClick = (group) => {
        const rolesArray = formatRoles(group.roles)
            .map((r) => r.replace(/^ROLE_/, ""))
            .filter(Boolean);
        setSelectedRoles(rolesArray);
        setGroupName(group.permission_name);
        setEditingGroupId(group.permission_id);
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                editingGroupId
                    ? translations["Editează grup de permisiuni"][language]
                    : translations["Creează grup de permisiuni"][language]
            }
            size="lg"
        >
            <Stack>
                <TextInput
                    label={translations["Nume grup"][language]}
                    placeholder={translations["Nume grup"][language]}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                />

                <Box>
                    <Text fw={600} mb={4}>
                        {translations["Selectați permisiunile"][language]}
                    </Text>
                    <RoleMatrix
                        selectedRoles={selectedRoles}
                        onToggle={toggleRole}
                    />
                </Box>

                <Group>
                    <Button onClick={handleSubmit}>
                        {editingGroupId
                            ? translations["Salvează modificările"][language]
                            : translations["Creează"][language]}
                    </Button>

                    {editingGroupId && (
                        <>
                            <Button color="red" onClick={handleDelete}>
                                {translations["Șterge grupul"][language]}
                            </Button>
                            <Button variant="default" onClick={resetForm}>
                                {translations["Anuleazǎ"][language]}
                            </Button>
                        </>
                    )}
                </Group>

                {existingGroups.length > 0 && (
                    <>
                        <Divider my="sm" />
                        <Text fw={600}>
                            {translations["Grupuri existente"][language]}
                        </Text>
                        <Stack spacing={4}>
                            {existingGroups.map((g) => (
                                <Box
                                    key={g.permission_id}
                                    onClick={() => handleGroupClick(g)}
                                    style={{
                                        cursor: "pointer",
                                        padding: 8,
                                        borderRadius: 4,
                                        background: "#f8f9fa",
                                        border: "1px solid #dee2e6",
                                        transition: "background 0.2s",
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.background = "#f1f3f5")
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = "#f8f9fa")
                                    }
                                >
                                    <Text fw={500}>{g.permission_name}</Text>
                                    <Text size="sm" c="dimmed">
                                        {/* {formatRoles(g.roles).join(", ")} */}
                                    </Text>
                                </Box>
                            ))}
                        </Stack>
                    </>
                )}
            </Stack>
        </Modal>
    );
};

export default CreatePermissionGroupModal;
