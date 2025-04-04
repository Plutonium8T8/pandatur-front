import { useEffect, useState } from "react";
import {
    Modal,
    Button,
    TextInput,
    Stack,
    Flex,
    Loader,
} from "@mantine/core";
import { FaTrash } from "react-icons/fa";
import { api } from "../../../api";

const EditGroupsListModal = ({ opened, onClose }) => {
    const [groups, setGroups] = useState([]);
    const [newGroup, setNewGroup] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const data = await api.user.getGroupsList();
            setGroups(data);
        } catch (err) {
            console.error("Ошибка при загрузке групп", err);
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
                console.error("Ошибка при создании группы", err);
            }
        }
    };

    const handleDelete = async (groupId) => {
        try {
            await api.user.deleteGroups(groupId);
            setGroups((prev) => prev.filter((g) => g.id !== groupId));
        } catch (err) {
            console.error("Ошибка при удалении группы", err);
        }
    };

    useEffect(() => {
        if (opened) {
            fetchGroups();
        }
    }, [opened]);

    return (
        <Modal opened={opened} onClose={onClose} title="Редактировать группы" size="md">
            <Stack>

                <Flex gap="sm" justify="space-between">
                    <TextInput
                        placeholder="Новая группа"
                        value={newGroup}
                        onChange={(e) => setNewGroup(e.target.value)}
                        fullWidth
                    />
                    <Button onClick={handleAdd}>Добавить</Button>
                </Flex>

                {loading ? (
                    <Loader />
                ) : (
                    groups.map((group) => (
                        <Flex key={group.id} justify="space-between" align="center">
                            <span>{group.name}</span>
                            <FaTrash onClick={() => handleDelete(group.id)} />
                        </Flex>
                    ))
                )}

                <Flex justify="space-between" mt="md">
                    <Button variant="light" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button onClick={onClose}>
                        Закрыть
                    </Button>
                </Flex>
            </Stack>
        </Modal>
    );
};

export default EditGroupsListModal;
