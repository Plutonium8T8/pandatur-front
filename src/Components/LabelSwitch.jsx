import { Flex, Text, Switch } from "@mantine/core";

export const LabelSwitch = ({ mt, label, ...props }) => {
  const { error, ...rest } = props;
  return (
    <>
      <Flex align="center" justify="space-between" mt={mt}>
        <Text size="sm">{label}</Text>
        <Switch {...rest} />
      </Flex>
      {error && (
        <Text size="xs" c="red">
          {error}
        </Text>
      )}
    </>
  );
};
