import { Grid, Text, Paper, Stack, Box, Divider } from "@mantine/core";
import { categories, actions, levels } from "../../utils/permissionConstants";

const getCircleStyle = (isActive, color) => ({
    width: 17,
    height: 17,
    borderRadius: "50%",
    border: `1px solid ${color}`,
    backgroundColor: isActive ? color : "transparent",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
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
            </Grid>

            {categories.map((category, index) => (
                <Box key={category}>
                    {index > 0 && <Divider my="sm" />}
                    <Grid columns={actions.length + 2} gutter="xs" align="center">
                        <Grid.Col span={1}>
                            <Text fw={500}>{category}</Text>
                        </Grid.Col>

                        {actions.map((action) => {
                            const key = `${category}_${action}`;
                            const currentLevel = permissions[key] || "Denied";

                            return (
                                <Grid.Col span={1} key={key}>
                                    <Stack align="center" gap={6}>
                                        {levels.map(({ value, color }) => (
                                            <Box
                                                key={value}
                                                onClick={() => onChange(key, value)}
                                                style={getCircleStyle(currentLevel === value, color)}
                                            />
                                        ))}
                                    </Stack>
                                </Grid.Col>
                            );
                        })}

                        <Grid.Col span={1}>
                            <Stack gap={4}>
                                {levels.map(({ value, label, color }) => (
                                    <Text key={value} size="xs" c={color}>
                                        {label}
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
