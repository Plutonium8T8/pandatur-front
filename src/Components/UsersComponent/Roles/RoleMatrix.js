import { Box, Group, Switch, Text } from "@mantine/core";
import { categories, actions } from "../../utils/permissionConstants";

const RoleMatrix = ({ selectedRoles = [], onToggle }) => {
    return (
        <Box>
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
                                onChange={() => onToggle(role)}
                                size="xs"
                            />
                        );
                    })}
                </Group>
            ))}
        </Box>
    );
};

export default RoleMatrix;
