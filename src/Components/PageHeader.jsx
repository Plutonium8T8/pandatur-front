import { Flex, Text, Badge } from "@mantine/core";

export const PageHeader = ({ title, count, extraInfo, ...props }) => {
  return (
    <Flex align="center" justify="space-between" w="100%" {...props}>
      <Flex align="center" gap="8">
        <Text fw={700} size="xl">
          {title}
        </Text>

        {count && (
          <Badge size="lg" bg="#0f824c">
            {count}
          </Badge>
        )}
      </Flex>

      {extraInfo && (
        <Flex align="center" gap="md">
          {extraInfo}
        </Flex>
      )}
    </Flex>
  );
};
