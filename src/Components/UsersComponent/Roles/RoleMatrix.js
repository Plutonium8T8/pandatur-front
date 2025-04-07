import { Grid, Text, Switch, Paper } from "@mantine/core";
import { categories, actions } from "../../utils/permissionConstants";

const RoleMatrix = ({ selectedRoles = [], onToggle }) => {
    return (
        <Paper withBorder p="sm" radius="md">
            <Grid columns={actions.length + 1} gutter="xs" mb="xs" align="center">
                <Grid.Col span={1}></Grid.Col>
                {actions.map((action) => (
                    <Grid.Col span={1} key={action}>
                        <Text fw={500} ta="center">{action}</Text>
                    </Grid.Col>
                ))}
            </Grid>

            {categories.map((category) => (
                <Grid columns={actions.length + 1} gutter="xs" key={category} align="center">
                    <Grid.Col span={1}>
                        <Text fw={500}>{category}</Text>
                    </Grid.Col>
                    {actions.map((action) => {
                        const role = `${category}_${action}`;
                        return (
                            <Grid.Col span={1} key={role}>
                                <Switch
                                    checked={selectedRoles.includes(role)}
                                    onChange={() => onToggle(role)}
                                    size="md"
                                    styles={{ body: { justifyContent: "center" } }}
                                />
                            </Grid.Col>
                        );
                    })}
                </Grid>
            ))}
        </Paper>
    );
};

export default RoleMatrix;
