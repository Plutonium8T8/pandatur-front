import { useEffect, useState, useMemo } from "react";
import { Box, Button, Group, Select, Flex } from "@mantine/core";
import { MantineModal } from "../MantineModal";
import { translations } from "../utils";
import { api } from "../../api";
import { useSnackbar } from "notistack";

const language = localStorage.getItem("language") || "RO";

const UserFilterModal = ({ opened, onClose, onApply, users }) => {
    const [filters, setFilters] = useState({});
    const [userGroups, setUserGroups] = useState([]);
    const [permissionGroups, setPermissionGroups] = useState([]);
    const { enqueueSnackbar } = useSnackbar();

    const functieOptions = useMemo(
        () => [...new Set(users.map((u) => u.jobTitle).filter(Boolean))],
        [users]
    );

    const statusOptions = [
        { value: "active", label: translations["Activ"][language] },
        { value: "inactive", label: translations["Inactiv"][language] },
    ];

    useEffect(() => {
        if (!opened) return;

        api.user
            .getGroupsList()
            .then((res) => {
                setUserGroups(res.map((g) => ({ value: g.name, label: g.name })));
            })
            .catch(() => {
                enqueueSnackbar(translations["Eroare la încărcarea grupurilor"][language], {
                    variant: "error",
                });
            });

        api.permissions
            .getAllPermissionGroups()
            .then((res) => {
                setPermissionGroups(
                    res.map((p) => ({
                        value: p.permission_name,
                        label: p.permission_name,
                    }))
                );
            })
            .catch(() => {
                enqueueSnackbar(
                    translations["Eroare la încărcarea grupurilor existente"][language],
                    { variant: "error" }
                );
            });
    }, [opened, enqueueSnackbar]);

    const handleChange = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleClear = () => {
        setFilters({});
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    return (
        <MantineModal
            open={opened}
            onClose={onClose}
            title={translations["FilterForUser"][language]}
        >
            <Flex direction="column" h="100%" justify="space-between">
                <Box p="sm">
                    <Flex direction="column" gap="sm">
                        <Select
                            label={translations["Grup utilizator"][language]}
                            placeholder={translations["Alege grupul"][language]}
                            data={userGroups}
                            value={filters.group || null}
                            onChange={(val) => handleChange("group", val)}
                            clearable
                            searchable
                        />

                        <Select
                            label={translations["Grup permisiuni"][language]}
                            placeholder={translations["Alege grupul de permisiuni"][language]}
                            data={permissionGroups}
                            value={filters.role || null}
                            onChange={(val) => handleChange("role", val)}
                            clearable
                            searchable
                        />

                        <Select
                            label={translations["Status"][language]}
                            placeholder={translations["Status"][language]}
                            data={statusOptions}
                            value={filters.status || null}
                            onChange={(val) => handleChange("status", val)}
                            clearable
                            searchable
                        />

                        <Select
                            label={translations["Funcție"][language]}
                            placeholder={translations["Funcție"][language]}
                            data={functieOptions}
                            value={filters.functie || null}
                            onChange={(val) => handleChange("functie", val)}
                            clearable
                            searchable
                        />
                    </Flex>
                </Box>

                <Box p="sm">
                    <Group justify="flex-end">
                        <Button variant="outline" onClick={handleClear}>
                            {translations["Reset filtru"][language]}
                        </Button>
                        <Button onClick={handleApply}>
                            {translations["Aplică"][language]}
                        </Button>
                    </Group>
                </Box>
            </Flex>
        </MantineModal>
    );
};

export default UserFilterModal;
