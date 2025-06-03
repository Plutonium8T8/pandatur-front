import { Modal, Text } from "@mantine/core";

export const MantineModal = ({
  children,
  open,
  title,
  onClose = () => { },
  height = "100vh",
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
      overlayProps={{
        opacity: 0,
        backgroundOpacity: 0,
        pointerEvents: "none",
      }}
      styles={{
        content: {
          position: "absolute",
          left: "250px",
          width: "calc(100% - 250px)",
          height,
          zIndex: 1001,
          pointerEvents: "auto",
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
