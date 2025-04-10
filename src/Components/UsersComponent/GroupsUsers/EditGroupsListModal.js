import { useEffect, useState } from "react";
import {
    Modal,
    Button,
    TextInput,
    Stack,
    Flex,
    Loader
} from "@mantine/core";
import { IoTrash } from "react-icons/io5";
import { api } from "../../../api";
import { translations } from "../../utils/translations";
import { useConfirmPopup } from "../../../hooks/useConfirmPopup";
import { getLanguageByKey } from "../../utils";

const language = localStorage.getItem('language') || 'RO';

const EditGroupsListModal = ({ opened, onClose }) => {
    const [groups, setGroups] = useState([]);
    const [newGroup, setNewGroup] = useState("");
    const [loading, setLoading] = useState(true);

    const confirmDelete = useConfirmPopup({
        subTitle: getLanguageByKey("Sigur doriți să ștergeți acest grup?"),
    });

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const data = await api.user.getGroupsList();
            setGroups(data);
        } catch (err) {
            console.error(translations["Eroare la încărcarea grupurilor"][language], err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        const trimmed = newGroup.trim();
        if (trimmed && !groups.find((g) => g.name === trimmed)) {
            try {
                const created = await api.user.createGroup({ name: trimmed });
                setGroups((prev) => [...prev, created]);
                setNewGroup("");
            } catch (err) {
                console.error(translations["Eroare la crearea grupului"][language], err);
            }
        }
    };

    const handleDelete = async (groupId) => {
        confirmDelete(async () => {
            try {
                await api.user.deleteGroups(groupId);
                setGroups((prev) => prev.filter((g) => g.id !== groupId));
            } catch (err) {
                console.error(translations["Eroare la ștergerea grupului"][language], err);
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
                <Flex gap="sm" justify="space-between">
                    <TextInput
                        placeholder={translations["Grup nou"][language]}
                        value={newGroup}
                        onChange={(e) => setNewGroup(e.target.value)}
                    />
                    <Button onClick={handleAdd}>
                        {translations["Adaugă"][language]}
                    </Button>
                </Flex>

                {loading ? (
                    <Loader />
                ) : (
                    groups.map((group) => (
                        <Flex
                            key={group.id}
                            justify="space-between"
                            align="center"
                            px="sm"
                            py={6}
                            style={{
                                borderRadius: 4,
                                transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#f8f9fa";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                            }}
                        >
                            <span>{group.name}</span>
                            <IoTrash
                                color="red"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleDelete(group.id)}
                            />
                        </Flex>
                    ))
                )}
            </Stack>
        </Modal>
    );
};

export default EditGroupsListModal;
