import {
    Modal,
    TextInput,
    Button,
    Box,
    Text,
    Switch,
    Stack,
    Group,
    Divider,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { api } from "../../../api";
import { translations } from "../../utils/translations";
import { useSnackbar } from "notistack";

const language = localStorage.getItem("language") || "RO";

const categories = ["CHAT", "LEAD", "DASHBOARD", "ACCOUNT", "NOTIFICATION", "TASK"];
const actions = ["READ", "WRITE", "ADMIN"];

const CreatePermissionGroupModal = ({ opened, onClose }) => {
    const [groupName, setGroupName] = useState("");
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [existingGroups, setExistingGroups] = useState([]);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        if (opened) fetchExistingGroups();
    }, [opened]);

    const fetchExistingGroups = async () => {
        try {
            const data = await api.users.getAllPermissionGroups();
            setExistingGroups(data);
        } catch (error) {
            enqueueSnackbar("Eroare la încărcarea grupurilor existente", {
                variant: "error",
            });
        }
    };

    const toggleRole = (role) => {
        setSelectedRoles((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
        );
    };

    const handleCreate = async () => {
        if (!groupName || selectedRoles.length === 0) {
            enqueueSnackbar(
                translations["Completați toate câmpurile obligatorii"][language],
                { variant: "warning" }
            );
            return;
        }

        try {
            await api.users.createPermissionGroup({
                name: groupName,
                roles: selectedRoles.map((r) => "ROLE_" + r),
            });
            enqueueSnackbar(
                translations["Grup de permisiuni creat cu succes"][language],
                { variant: "success" }
            );
            setGroupName("");
            setSelectedRoles([]);
            fetchExistingGroups();
            onClose();
        } catch (err) {
            enqueueSnackbar(
                translations["Eroare la crearea grupului de permisiuni"][language],
                { variant: "error" }
            );
        }
    };

    const formatRoles = (roles) => {
        if (Array.isArray(roles)) return roles;
        if (typeof roles === "object" && roles !== null) {
            return Object.values(roles);
        }
        return [];
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={translations["Creează grup de permisiuni"][language]}
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
                    {categories.map((category) => (
                        <Group key={category}>
                            <Text w={100}>{category}</Text>
                            {actions.map((action) => {
                                const role = `${category}_${action}`;
                                return (
                                    <Switch
                                        key={role}
                                        label={action}
                                        checked={selectedRoles.includes(role)}
                                        onChange={() => toggleRole(role)}
                                        size="xs"
                                    />
                                );
                            })}
                        </Group>
                    ))}
                </Box>

                <Button onClick={handleCreate}>
                    {translations["Creează"][language]}
                </Button>

                {existingGroups.length > 0 && (
                    <>
                        <Divider my="sm" />
                        <Text fw={600}>
                            {translations["Grupuri existente"]?.[language] || "Grupuri existente"}
                        </Text>
                        <Stack spacing={4}>
                            {existingGroups.map((g) => (
                                <Box key={g.permission_id}>
                                    <Text fw={500}>{g.permission_name}</Text>
                                    <Text size="sm" c="dimmed">
                                        {formatRoles(g.roles).join(", ")}
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
