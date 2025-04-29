import { Flex, Text, Badge, Divider } from "@mantine/core";

export const PageHeader = ({ title, count, extraInfo, withDivider = true, badgeColor = "#0f824c", ...props }) => {
  return (
    <>
      <Flex align="center" justify="space-between" w="100%" {...props}>
        <Flex align="center" gap="8">
          <Text fw={700} size="xl">
            {title}
          </Text>

          {!!count && (
            <Badge size="lg" bg={badgeColor}>
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

      {withDivider && <Divider my="md" />}
    </>
  );
};
