import { Modal, Text } from "@mantine/core";

export const MantineModal = ({
  children,
  open,
  title,
  onClose,
  height = "700px",
  size = 700,
  ...props
}) => {
  const { style, ...rest } = props;
  return (
    <Modal
      centered
      size={size}
      opened={open}
      onClose={onClose}
      styles={{
        body: { height: `${height}`, ...style },
      }}
      title={
        title && (
          <Text size="xl" fw="bold">
            {title}
          </Text>
        )
      }
      {...rest}
    >
      {children}
    </Modal>
  );
};
