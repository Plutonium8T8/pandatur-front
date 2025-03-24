import { openConfirmModal } from "@mantine/modals"
import { Title, Text, DEFAULT_THEME } from "@mantine/core"
import { getLanguageByKey } from "../Components/utils"

const { colors } = DEFAULT_THEME

export const useConfirmPopup = ({ title, subTitle, onConfirm, loading }) => {
  return (callback) =>
    openConfirmModal({
      title: <Title order={3}>{title}</Title>,
      centered: true,
      children: <Text>{subTitle}</Text>,
      labels: {
        confirm: getLanguageByKey("Șterge"),
        cancel: getLanguageByKey("Anulează")
      },
      confirmProps: { color: colors.red[9], loading },
      onConfirm: callback
    })
}
