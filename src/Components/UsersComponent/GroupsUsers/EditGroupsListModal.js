import { useEffect, useState } from "react";
import {
    Modal,
    Button,
    TextInput,
    Stack,
    Flex,
    Loader,
    Paper,
    Text
} from "@mantine/core";
import { IoTrash } from "react-icons/io5";
import { api } from "../../../api";
import { translations } from "../../utils/translations";
import { useConfirmPopup } from "../../../hooks/useConfirmPopup";
import { getLanguageByKey } from "../../utils";
import { useSnackbar } from "notistack";

const language = localStorage.getItem("language") || "RO";

const EditGroupsListModal = ({ opened, onClose }) => {
    const [groups, setGroups] = useState([]);
    const [newGroup, setNewGroup] = useState("");
    const [loading, setLoading] = useState(true);
    const { enqueueSnackbar } = useSnackbar();

    const confirmDelete = useConfirmPopup({
        subTitle: getLanguageByKey("Sigur doriți să ștergeți acest grup?"),
    });

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const data = await api.user.getGroupsList();
            setGroups(data.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err) {
            enqueueSnackbar(translations["Eroare la încărcarea grupurilor"][language], {
                variant: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        const trimmed = newGroup.trim();
        if (trimmed && !groups.find((g) => g.name === trimmed)) {
            try {
                const created = await api.user.createGroup({ name: trimmed });
                setGroups((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
                setNewGroup("");
                enqueueSnackbar(translations["Grup adăugat cu succes"][language], {
                    variant: "success"
                });
            } catch (err) {
                enqueueSnackbar(translations["Eroare la crearea grupului"][language], {
                    variant: "error"
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
                    variant: "success"
                });
            } catch (err) {
                enqueueSnackbar(translations["Eroare la ștergerea grupului"][language], {
                    variant: "error"
                });
            }
        });
    };

    useEffect(() => {
        if (opened) {
            fetchGroups();
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
                {/* <Paper withBorder p="md" radius="md"> */}
                <Flex gap="sm">
                    <TextInput
                        placeholder={translations["Grup nou"][language]}
                        value={newGroup}
                        onChange={(e) => setNewGroup(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <Button onClick={handleAdd}>
                        {translations["Adaugă"][language]}
                    </Button>
                </Flex>
                {/* </Paper> */}

                {loading ? (
                    <Loader />
                ) : (
                    groups.map((group) => (
                        <Paper key={group.id} withBorder p="sm" radius="md">
                            <Flex justify="space-between" align="center">
                                <Text>{group.name}</Text>
                                <IoTrash
                                    color="red"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleDelete(group.id)}
                                />
                            </Flex>
                        </Paper>
                    ))
                )}
            </Stack>
        </Modal>
    );
};

export default EditGroupsListModal;
