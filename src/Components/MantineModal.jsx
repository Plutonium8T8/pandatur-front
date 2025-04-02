import { Modal, Text } from "@mantine/core";

export const MantineModal = ({
  children,
  open,
  title,
  onClose,
  footer,
  ...props
}) => {
  return (
    <Modal
      centered
      size="700"
      opened={open}
      onClose={onClose}
      styles={{
        body: { height: "700px" },
      }}
      title={
        <Text size="xl" fw="bold">
          {title}
        </Text>
      }
      {...props}
    >
      {children}
    </Modal>
  );
};
