import { Flex, Text, Badge, Divider, Stack } from "@mantine/core";
import { useMobile } from "@hooks";

export const PageHeader = ({ title, count, extraInfo, withDivider = true, badgeColor = "#0f824c", ...props }) => {
  const isMobile = useMobile();

  return (
    <>
      {isMobile ? (
        <Stack gap="md" w="100%" {...props}>
          <Flex align="center" justify="space-between" w="100%">
            <Flex align="center" gap="8">
              <Text fw={700} size="lg">
                {title}
              </Text>
              {!!count && (
                <Badge size="md" bg={badgeColor}>
                  {count}
                </Badge>
              )}
            </Flex>
          </Flex>
          
          {extraInfo && (
            <Flex align="center" gap="sm" wrap="wrap">
              {extraInfo}
            </Flex>
          )}
        </Stack>
      ) : (
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
      )}

      {withDivider && <Divider my="md" />}
    </>
  );
};
