import {
    Modal,
    TextInput,
    Button,
    Box,
    Text,
    Stack,
    Divider,
    Group,
    ScrollArea,
} from "@mantine/core";
import { useState, useEffect } from "react";
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
    const { enqueueSnackbar } = useSnackbar();

    const confirmDelete = useConfirmPopup({
        subTitle: translations["Sigur doriți să ștergeți acest grup?"][language],
    });

    useEffect(() => {
        if (opened) {
            loadPermissionGroups();
        } else {
            resetForm();
        }
    }, [opened]);

    const resetForm = () => {
        setGroupName("");
        setRoleMatrix({});
        setEditingGroupId(null);
    };

    const loadPermissionGroups = async () => {
        try {
            const groups = await api.permissions.getAllPermissionGroups();
            setExistingGroups(groups);
        } catch {
            enqueueSnackbar(
                translations["Eroare la încărcarea grupurilor existente"][language],
                { variant: "error" }
            );
        }
    };

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
        }
    };

    const handleDelete = () => {
        if (!editingGroupId) return;

        confirmDelete(async () => {
            try {
                await api.permissions.deletePermissionGroup(editingGroupId);
                enqueueSnackbar(
                    translations["Grup șters cu succes"][language],
                    { variant: "success" }
                );
                await loadPermissionGroups();
                resetForm();
            } catch {
                enqueueSnackbar(
                    translations["Eroare la ștergerea grupului"][language],
                    { variant: "error" }
                );
            }
        });
    };

    const handleSelectGroup = (group) => {
        const matrix = {};
        const roles = Array.isArray(group.roles) ? group.roles : safeParseJson(group.roles);

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
            const parsed = JSON.parse(str);
            return Array.isArray(parsed) ? parsed : [];
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
            size="lg"
        >
            {/* <ScrollArea h={900}> */}
            <Stack>
                <Box>
                    <TextInput
                        label={translations["Nume grup"][language]}
                        placeholder={translations["Nume grup"][language]}
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        required
                        mb="md"
                    />

                    <Text fw={600} mb={4}>
                        {translations["Selectați permisiunile"][language]}
                    </Text>

                    <RoleMatrix permissions={roleMatrix} onChange={handleMatrixChange} />

                    <Group mt="sm">
                        <Button onClick={handleSave}>
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

                    <Divider my="sm" />
                </Box>

                {existingGroups.length > 0 && (
                    <>
                        <Text fw={600}>{translations["Grupuri existente"][language]}</Text>
                        <Stack spacing={4}>
                            {existingGroups.map((group) => (
                                <Box
                                    key={group.permission_id}
                                    onClick={() => handleSelectGroup(group)}
                                    style={{
                                        cursor: "pointer",
                                        padding: 8,
                                        borderRadius: 4,
                                        background: "#f8f9fa",
                                        border: "1px solid #dee2e6",
                                        transition: "background 0.2s",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f5")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                                >
                                    <Text fw={500}>{group.permission_name}</Text>
                                </Box>
                            ))}
                        </Stack>
                    </>
                )}
            </Stack>
            {/* </ScrollArea> */}
        </Modal>
    );
};

export default CreatePermissionGroupModal;
