import { useState } from "react";
import {
    Modal,
    Button,
    TextInput,
    Stack,
    CloseButton,
    Flex,
} from "@mantine/core";
import { groupUsersOptions } from "./GroupUsersOptions";

const EditGroupsListModal = ({ opened, onClose }) => {
    const [groups, setGroups] = useState([...groupUsersOptions]);
    const [newGroup, setNewGroup] = useState("");

    const handleAdd = () => {
        const trimmed = newGroup.trim();
        if (trimmed && !groups.includes(trimmed)) {
            setGroups((prev) => [...prev, trimmed]);
            setNewGroup("");
        }
    };

    const handleDelete = (group) => {
        setGroups((prev) => prev.filter((g) => g !== group));
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Редактировать группы" size="md">
            <Stack>
                {groups.map((group) => (
                    <Flex key={group} justify="space-between" align="center">
                        <span>{group}</span>
                        <CloseButton onClick={() => handleDelete(group)} />
                    </Flex>
                ))}

                <Flex gap="sm">
                    <TextInput
                        placeholder="Новая группа"
                        value={newGroup}
                        onChange={(e) => setNewGroup(e.target.value)}
                        fullWidth
                    />
                    <Button onClick={handleAdd}>Добавить</Button>
                </Flex>

                <Flex justify="flex-end" mt="md">
                    <Button onClick={onClose} variant="light">
                        Закрыть
                    </Button>
                </Flex>
            </Stack>
        </Modal>
    );
};

export default EditGroupsListModal;
