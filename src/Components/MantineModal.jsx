import { Modal, Text } from "@mantine/core";

export const MantineModal = ({
  children,
  open,
  title,
  onClose = () => { },
  height = "100vh",
  size = "calc(100% - 250px)",
  ...props
}) => {
  const { style, ...rest } = props;
  return (
    <Modal
      opened={open}
      onClose={onClose}
      withCloseButton
      closeOnClickOutside
      size={size}
      centered={false}
      styles={{
        content: {
          marginLeft: "500px",
          height,
          ...style,
        },
        body: {
          height: "100%",
        },
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
