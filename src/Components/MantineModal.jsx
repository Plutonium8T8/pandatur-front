import { Modal, Text } from "@mantine/core";

export const MantineModal = ({
  children,
  open,
  title,
  onClose = () => { },
  height = "100vh",
  size = "calc(100% - 200px)",
  ...props
}) => {
  const { style, ...rest } = props;

  return (
    <Modal
      opened={open}
      onClose={onClose}
      withCloseButton
      closeOnClickOutside
      size={false}
      centered={false}
      styles={{
        content: {
          position: "absolute",
          left: "250px",
          width: "calc(100% - 250px)",
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
