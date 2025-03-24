import { openConfirmModal } from "@mantine/modals"
import { Text, DEFAULT_THEME } from "@mantine/core"
import { getLanguageByKey } from "../Components/utils"

const { colors } = DEFAULT_THEME

export const useConfirmPopup = ({ title, subTitle, onConfirm, loading }) => {
  return (callback) =>
    openConfirmModal({
      title: (
        <Text fz="xl" fw="bold">
          {title}
        </Text>
      ),
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
