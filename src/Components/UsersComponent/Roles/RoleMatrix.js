import { Grid, Text, Switch, Paper } from "@mantine/core";
import { categories, actions } from "../../utils/permissionConstants";

const RoleMatrix = ({ selectedRoles = [], disabledRoles = [], onToggle }) => {
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
                        const isChecked = selectedRoles.includes(role);
                        const isDisabled = disabledRoles.includes(role);

                        return (
                            <Grid.Col span={1} key={role}>
                                <Switch
                                    checked={isChecked}
                                    onChange={() => onToggle(role)}
                                    disabled={isDisabled}
                                    size="md"
                                    styles={{
                                        body: { justifyContent: "center" },
                                        track: {
                                            backgroundColor: isChecked
                                                ? isDisabled
                                                    ? "#b2f2bb"
                                                    : "var(--mantine-color-green-6)"
                                                : undefined,
                                            border: "1px solid #ced4da",
                                        },
                                    }}
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
