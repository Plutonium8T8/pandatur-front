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
import { translations } from "../../utils/translations";
import { useSnackbar } from "notistack";
import RoleMatrix from "./RoleMatrix";
import { useConfirmPopup } from "../../../hooks";
import { categories, actions, LEVEL_VALUES } from "../../utils"; // убедись, что импортируются эти значения

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
            fetchExistingGroups();
        } else {
            resetForm();
        }
    }, [opened]);

    const resetForm = () => {
        setGroupName("");
        setRoleMatrix({});
        setEditingGroupId(null);
    };

    const fetchExistingGroups = async () => {
        try {
            const data = await api.permissions.getAllPermissionGroups();
            setExistingGroups(data);
        } catch (error) {
            enqueueSnackbar(
                translations["Eroare la încărcarea grupurilor existente"][language],
                { variant: "error" }
            );
        }
    };

    const handleChangeMatrix = (key, value) => {
        setRoleMatrix((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const generateRoleArray = (matrix) => {
        const allRoles = [];

        categories.forEach((category) => {
            actions.forEach((action) => {
                const key = `${category}_${action}`;
                const level = matrix[key] || "Denied";
                const levelValue = LEVEL_VALUES[level] || "DENIED";
                allRoles.push(`ROLE_${key}_${levelValue}`);
            });
        });

        return allRoles;
    };

    const handleSubmit = async () => {
        if (!groupName || Object.keys(roleMatrix).length === 0) {
            enqueueSnackbar(
                translations["Completați toate câmpurile obligatorii"][language],
                { variant: "warning" }
            );
            return;
        }

        const roles = generateRoleArray(roleMatrix);

        const payload = {
            name: groupName,
            roles,
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

            fetchExistingGroups();
            resetForm();
        } catch (err) {
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
                enqueueSnackbar(translations["Grup șters cu succes"][language], {
                    variant: "success",
                });
                fetchExistingGroups();
                resetForm();
            } catch (err) {
                enqueueSnackbar(
                    translations["Eroare la ștergerea grupului"][language],
                    { variant: "error" }
                );
            }
        });
    };

    const handleGroupClick = (group) => {
        const matrix = {};

        if (group.roles?.length) {
            group.roles.forEach((roleStr) => {
                const withoutPrefix = roleStr.replace(/^ROLE_/, "");
                const parts = withoutPrefix.split("_");
                const level = parts.pop();
                const key = parts.join("_");

                const readableLevel = Object.keys(LEVEL_VALUES).find(
                    (k) => LEVEL_VALUES[k] === level.toUpperCase()
                );

                if (readableLevel) {
                    matrix[key] = readableLevel;
                }
            });
        }

        setRoleMatrix(matrix);
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
            size="xl"
        >
            <ScrollArea h={800}>
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

                        <RoleMatrix permissions={roleMatrix} onChange={handleChangeMatrix} />

                        <Group mt="sm">
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
                        <Divider my="sm" />
                    </Box>

                    {existingGroups.length > 0 && (
                        <>
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
                                    </Box>
                                ))}
                            </Stack>
                        </>
                    )}
                </Stack>
            </ScrollArea>
        </Modal>
    );
};

export default CreatePermissionGroupModal;
