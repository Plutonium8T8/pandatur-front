import { useMemo } from 'react';
import { createGeneralWidget } from '../utils/dashboardHelpers';
import { 
  createGroupTitleWidgets,
  createUserGroupWidgets,
  createUserWidgets,
  createTopUsersWidget,
  createPlatformWidgets,
  createSourceWidgets
} from '../utils/dashboardWidgets';

/**
 * Хук для построения виджетов дашборда
 */
export const useDashboardData = (rawData, userNameById, widgetType, getLanguageByKey) => {
  return useMemo(() => {
    if (!rawData) return [];

    const widgets = [];
    const data = rawData;

    // General виджет
    const generalWidget = createGeneralWidget(data, widgetType, getLanguageByKey);
    if (generalWidget) {
      widgets.push(generalWidget);
    }

    // Виджеты по group_title
    const groupTitleWidgets = createGroupTitleWidgets(data, widgetType, getLanguageByKey);
    widgets.push(...groupTitleWidgets);

    // Виджеты по user_group
    const userGroupWidgets = createUserGroupWidgets(data, widgetType, getLanguageByKey);
    widgets.push(...userGroupWidgets);

    // Виджеты по пользователям
    const userWidgets = createUserWidgets(data, widgetType, getLanguageByKey, userNameById);
    widgets.push(...userWidgets);

    // Топ пользователей
    const topUsersWidget = createTopUsersWidget(data, widgetType, getLanguageByKey, userNameById);
    if (topUsersWidget) {
      widgets.push(topUsersWidget);
    }

    // Виджеты платформ (для messages)
    const platformWidgets = createPlatformWidgets(data, widgetType, getLanguageByKey);
    widgets.push(...platformWidgets);

    // Виджеты источников (для calls)
    const sourceWidgets = createSourceWidgets(data, getLanguageByKey);
    widgets.push(...sourceWidgets);

    return widgets;
  }, [rawData, userNameById, widgetType, getLanguageByKey]);
};
