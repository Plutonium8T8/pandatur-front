import {
    Modal,
    TextInput,
    Button,
    Box,
    Text,
    Stack,
    Divider,
    Group,
    Loader,
    Center,
    Grid,
    Paper,
} from "@mantine/core";
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../api";
import { useSnackbar } from "notistack";
import RoleMatrix from "./RoleMatrix";
import { useConfirmPopup } from "../../../hooks";
import { translations } from "../../utils/translations";
import { categories, actions, LEVEL_VALUES } from "../../utils";

const language = localStorage.getItem("language") || "RO";

const CreatePermissionGroupModal = ({ opened, onClose }) => {
    const [groupName, setGroupName] = useState("");
    const [roleMatrix, setRoleMatrix] = useState({});
    const [existingGroups, setExistingGroups] = useState([]);
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const { enqueueSnackbar } = useSnackbar();

    const confirmDelete = useConfirmPopup({
        subTitle: translations["Sigur doriți să ștergeți acest grup?"][language],
    });

    const resetForm = useCallback(() => {
        setGroupName("");
        setRoleMatrix({});
        setEditingGroupId(null);
    }, []);

    const loadPermissionGroups = useCallback(async () => {
        setLoading(true);
        try {
            const groups = await api.permissions.getAllPermissionGroups();
            setExistingGroups(groups);
        } catch {
            enqueueSnackbar(
                translations["Eroare la încărcarea grupurilor existente"][language],
                { variant: "error" }
            );
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        if (opened) {
            loadPermissionGroups();
        } else {
            resetForm();
        }
    }, [opened, loadPermissionGroups, resetForm]);

    const handleMatrixChange = (key, value) => {
        setRoleMatrix((prev) => ({ ...prev, [key]: value }));
    };

    const convertMatrixToRoles = (matrix) => {
        return categories.flatMap((category) =>
            actions.map((action) => {
                const key = `${category}_${action}`;
                const level = matrix[key] || "Denied";
                const levelValue = LEVEL_VALUES[level] || "DENIED";
                return `ROLE_${key}_${levelValue}`;
            })
        );
    };

    const handleSave = async () => {
        if (!groupName || Object.keys(roleMatrix).length === 0) {
            enqueueSnackbar(
                translations["Completați toate câmpurile obligatorii"][language],
                { variant: "warning" }
            );
            return;
        }

        setSaving(true);

        const payload = {
            name: groupName,
            roles: convertMatrixToRoles(roleMatrix),
        };

        try {
            if (editingGroupId) {
                await api.permissions.updatePermissionGroup(editingGroupId, payload);
                enqueueSnackbar(
                    translations["Grup de permisiuni actualizat cu succes"][language],
                    { variant: "success" }
                );
            } else {
                await api.permissions.createPermissionGroup(payload);
                enqueueSnackbar(
                    translations["Grup de permisiuni creat cu succes"][language],
                    { variant: "success" }
                );
            }

            await loadPermissionGroups();
            resetForm();
        } catch {
            enqueueSnackbar(
                translations["Eroare la salvarea grupului de permisiuni"][language],
                { variant: "error" }
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (!editingGroupId) return;

        confirmDelete(async () => {
            setDeleting(true);
            try {
                await api.permissions.deletePermissionGroup(editingGroupId);
                enqueueSnackbar(translations["Grup șters cu succes"][language], {
                    variant: "success",
                });
                await loadPermissionGroups();
                resetForm();
            } catch {
                enqueueSnackbar(translations["Eroare la ștergerea grupului"][language], {
                    variant: "error",
                });
            } finally {
                setDeleting(false);
            }
        });
    };

    const handleSelectGroup = (group) => {
        const matrix = {};
        const roles = Array.isArray(group.roles)
            ? group.roles
            : safeParseJson(group.roles);

        roles.forEach((roleStr) => {
            const trimmed = roleStr.replace(/^ROLE_/, "");
            const parts = trimmed.split("_");
            const level = parts.pop();
            const key = parts.join("_");

            const readable = Object.keys(LEVEL_VALUES).find(
                (k) => LEVEL_VALUES[k] === level.toUpperCase()
            );

            if (readable) {
                matrix[key] = readable;
            }
        });

        setGroupName(group.permission_name);
        setEditingGroupId(group.permission_id);
        setRoleMatrix(matrix);
    };

    const safeParseJson = (str) => {
        try {
            return typeof str === "string" ? JSON.parse(str) : [];
        } catch {
            return [];
        }
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
            size="xl"
        >
            <Stack gap="md">
                {/* Поле ввода названия группы */}
                <TextInput
                    label={translations["Nume grup"][language]}
                    placeholder={translations["Nume grup"][language]}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                />

                {/* Двухколоночный layout */}
                <Grid gutter="md">
                    {/* Левая колонка - RoleMatrix */}
                    <Grid.Col span={8}>
                        <Box>
                            <Text fw={600} mb="xs">
                                {translations["Selectați permisiunile"][language]}
                            </Text>
                            <RoleMatrix permissions={roleMatrix} onChange={handleMatrixChange} />
                        </Box>
                    </Grid.Col>

                    {/* Правая колонка - Список групп */}
                    <Grid.Col span={4}>
                        <Box>
                            <Text fw={600} mb={4} size="xs">
                                {translations["Grupuri existente"][language]}
                            </Text>
                            
                            {loading ? (
                                <Center py="md">
                                    <Loader size="sm" />
                                </Center>
                            ) : existingGroups.length > 0 ? (
                                <Stack gap={4}>
                                    {existingGroups.map((group) => (
                                        <Paper
                                            key={group.permission_id}
                                            p={6}
                                            withBorder
                                            onClick={() => handleSelectGroup(group)}
                                            style={{
                                                cursor: "pointer",
                                                backgroundColor: editingGroupId === group.permission_id ? "#e7f5ff" : "#f8f9fa",
                                                borderColor: editingGroupId === group.permission_id ? "#339af0" : "#dee2e6",
                                                transition: "all 0.2s",
                                            }}
                                            onMouseEnter={(e) => {
                                                if (editingGroupId !== group.permission_id) {
                                                    e.currentTarget.style.backgroundColor = "#f1f3f5";
                                                    e.currentTarget.style.borderColor = "#adb5bd";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (editingGroupId !== group.permission_id) {
                                                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                                                    e.currentTarget.style.borderColor = "#dee2e6";
                                                }
                                            }}
                                        >
                                            <Text 
                                                fw={editingGroupId === group.permission_id ? 600 : 500}
                                                c={editingGroupId === group.permission_id ? "blue" : "dark"}
                                                size="xs"
                                            >
                                                {group.permission_name}
                                            </Text>
                                        </Paper>
                                    ))}
                                </Stack>
                            ) : (
                                <Paper p={8} withBorder>
                                    <Text size="xs" c="dimmed" ta="center">
                                        {translations["Nu există grupuri"][language]}
                                    </Text>
                                </Paper>
                            )}
                        </Box>
                    </Grid.Col>
                </Grid>

                <Divider />

                {/* Кнопки действий */}
                <Group justify="flex-end">
                    {editingGroupId && (
                        <>
                            <Button variant="default" onClick={resetForm}>
                                {translations["Anuleazǎ"][language]}
                            </Button>
                            <Button color="red" onClick={handleDelete} loading={deleting}>
                                {translations["Șterge grupul"][language]}
                            </Button>
                        </>
                    )}
                    <Button onClick={handleSave} loading={saving}>
                        {editingGroupId
                            ? translations["Salvează modificările"][language]
                            : translations["Creează"][language]}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default CreatePermissionGroupModal;
