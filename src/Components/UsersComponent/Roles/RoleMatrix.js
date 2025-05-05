import { Grid, Text, Paper, Stack, Box, Divider } from "@mantine/core";
import { categories, actions, levels } from "../../utils/permissionConstants";

const circleStyle = (active, color) => ({
    width: 17,
    height: 17,
    borderRadius: "50%",
    border: `1px solid ${color}`,
    backgroundColor: active ? color : "transparent",
    cursor: "pointer",
    transition: "background 0.2s",
});

const RoleMatrix = ({ permissions = {}, onChange }) => {
    return (
        <Paper withBorder p="sm" radius="md">
            <Grid columns={actions.length + 2} gutter="xs" mb="xs" align="center">
                <Grid.Col span={1}></Grid.Col>
                {actions.map((action) => (
                    <Grid.Col span={1} key={action}>
                        <Text fw={500} ta="center">{action}</Text>
                    </Grid.Col>
                ))}
                <Grid.Col span={1}>
                    <Text fw={500}>Legend</Text>
                </Grid.Col>
            </Grid>

            {categories.map((category, index) => (
                <Box key={category}>
                    {index > 0 && <Divider my="sm" />}
                    <Grid columns={actions.length + 2} gutter="xs" align="center">
                        <Grid.Col span={1}>
                            <Text fw={500}>{category}</Text>
                        </Grid.Col>

                        {actions.map((action) => {
                            const roleKey = `${category}_${action}`;
                            const value = permissions[roleKey] || "Denied";

                            return (
                                <Grid.Col span={1} key={roleKey}>
                                    <Stack align="center" gap={6}>
                                        {levels.map((lvl) => (
                                            <Box
                                                key={lvl.value}
                                                onClick={() => onChange(roleKey, lvl.value)}
                                                style={circleStyle(value === lvl.value, lvl.color)}
                                            />
                                        ))}
                                    </Stack>
                                </Grid.Col>
                            );
                        })}

                        <Grid.Col span={1}>
                            <Stack gap={4}>
                                {levels.map((lvl) => (
                                    <Text key={lvl.value} size="xs" c={lvl.color}>
                                        {lvl.label}
                                    </Text>
                                ))}
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </Box>
            ))}
        </Paper>
    );
};

export default RoleMatrix;
