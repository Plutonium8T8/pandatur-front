import { 
  safeArray, 
  createCountsData, 
  createTicketStateData, 
  createTicketsIntoWorkData,
  createSystemUsageData,
  createTicketDistributionData,
  createClosedTicketsCountData,
  createTicketsByDepartCountData,
  createTicketLifetimeStatsData,
  createTicketRateData,
  createWorkflowFromChangeData,
  createWorkflowToChangeData,
  createTicketCreationData,
  createWorkflowFromDePrelucratData,
  createWorkflowDurationData,
  createTicketDestinationData,
  mapPlatforms,
  BG_COLORS
} from './dashboardHelpers';

/**
 * Создает виджет для элемента данных
 */
const createWidgetFromData = (item, widgetType, getLanguageByKey, id, title, subtitle, bgColor) => {
  const baseWidget = {
    id,
    title: getLanguageByKey(title),
    subtitle,
    bg: bgColor,
  };

  switch (widgetType) {
    case "ticket_state": {
      const ts = createTicketStateData(item);
      return {
        ...baseWidget,
        type: "ticket_state",
        ...ts,
      };
    }
    case "tickets_into_work": {
      const tiw = createTicketsIntoWorkData(item);
      return {
        ...baseWidget,
        type: "tickets_into_work",
        ...tiw,
      };
    }
    case "system_usage": {
      const su = createSystemUsageData(item);
      return {
        ...baseWidget,
        type: "system_usage",
        ...su,
      };
    }
    case "ticket_distribution": {
      const td = createTicketDistributionData(item);
      return {
        ...baseWidget,
        type: "ticket_distribution",
        ...td,
      };
    }
    case "closed_tickets_count": {
      const ctc = createClosedTicketsCountData(item);
      return {
        ...baseWidget,
        type: "closed_tickets_count",
        ...ctc,
      };
    }
    case "tickets_by_depart_count": {
      const tbdc = createTicketsByDepartCountData(item);
      return {
        ...baseWidget,
        type: "tickets_by_depart_count",
        ...tbdc,
      };
    }
    case "ticket_lifetime_stats": {
      const tls = createTicketLifetimeStatsData(item);
      return {
        ...baseWidget,
        type: "ticket_lifetime_stats",
        ...tls,
      };
    }
    case "ticket_rate": {
      const tr = createTicketRateData(item);
      return {
        ...baseWidget,
        type: "ticket_rate",
        ...tr,
      };
    }
    case "workflow_from_change": {
      const wfc = createWorkflowFromChangeData(item);
      return {
        ...baseWidget,
        type: "workflow_from_change",
        ...wfc,
      };
    }
    case "workflow_to_change": {
      const wtc = createWorkflowToChangeData(item);
      return {
        ...baseWidget,
        type: "workflow_to_change",
        ...wtc,
      };
    }
    case "ticket_creation": {
      const tc = createTicketCreationData(item);
      return {
        ...baseWidget,
        type: "ticket_creation",
        ...tc,
      };
    }
    case "workflow_from_de_prelucrat": {
      const wfdp = createWorkflowFromDePrelucratData(item);
      return {
        ...baseWidget,
        type: "workflow_from_de_prelucrat",
        ...wfdp,
      };
    }
    case "workflow_duration": {
      const wd = createWorkflowDurationData(item);
      return {
        ...baseWidget,
        type: "workflow_duration",
        ...wd,
      };
    }
    default: {
      const c = createCountsData(item);
      return {
        ...baseWidget,
        type: "group",
        ...c,
      };
    }
  }
};

/**
 * Создает виджеты для группы по group_title
 */
export const createGroupTitleWidgets = (data, widgetType, getLanguageByKey) => {
  const byGt = safeArray(data.by_group_title);
  return byGt.map((r, idx) => {
    const name = r.group_title_name ?? r.group_title ?? r.group ?? "-";
    return createWidgetFromData(
      r, 
      widgetType, 
      getLanguageByKey, 
      `gt-${name ?? idx}`, 
      "Group title", 
      name || "-", 
      BG_COLORS.by_group_title
    );
  });
};

/**
 * Создает виджеты для группы по user_group
 */
export const createUserGroupWidgets = (data, widgetType, getLanguageByKey) => {
  const byUserGroup = safeArray(data.by_user_group);
  return byUserGroup.map((r, idx) => {
    const name = r.user_group_name ?? r.user_group ?? r.group ?? "-";
    return createWidgetFromData(
      r, 
      widgetType, 
      getLanguageByKey, 
      `ug-${idx}`, 
      "User group", 
      name || "-", 
      BG_COLORS.by_user_group
    );
  });
};

/**
 * Создает виджеты для пользователей
 */
export const createUserWidgets = (data, widgetType, getLanguageByKey, userNameById) => {
  const byUser = safeArray(data.by_user);
  return byUser.map((r, idx) => {
    const uid = Number(r.user_id);
    const name = userNameById.get(uid);
    const subtitle = (name || (Number.isFinite(uid) ? `ID ${uid}` : "-")) + (r.sipuni_id ? ` • ${r.sipuni_id}` : "");
    return createWidgetFromData(
      r, 
      widgetType, 
      getLanguageByKey, 
      `user-${uid || idx}`, 
      "User", 
      subtitle, 
      BG_COLORS.by_user
    );
  });
};

/**
 * Создает виджет топ пользователей
 */
export const createTopUsersWidget = (data, widgetType, getLanguageByKey, userNameById) => {
  const byUser = safeArray(data.by_user);
  if (!byUser.length) return null;

  const rows = byUser.map((r) => {
    const uid = Number(r.user_id);
    
    switch (widgetType) {
      case "ticket_state": {
        const ts = createTicketStateData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...ts,
          total: ts.totalTickets,
        };
      }
      case "tickets_into_work": {
        const tiw = createTicketsIntoWorkData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...tiw,
          total: tiw.takenIntoWorkTickets,
        };
      }
      case "system_usage": {
        const su = createSystemUsageData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...su,
          total: su.activityHours,
        };
      }
      case "ticket_distribution": {
        const td = createTicketDistributionData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...td,
          total: td.distributedTickets,
        };
      }
      case "closed_tickets_count": {
        const ctc = createClosedTicketsCountData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...ctc,
          total: ctc.totalClosedTickets,
        };
      }
      case "tickets_by_depart_count": {
        const tbdc = createTicketsByDepartCountData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...tbdc,
          total: tbdc.totalTickets,
        };
      }
      case "ticket_lifetime_stats": {
        const tls = createTicketLifetimeStatsData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...tls,
          total: tls.ticketsProcessed,
        };
      }
      case "ticket_rate": {
        const tr = createTicketRateData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...tr,
          total: tr.totalTransitions,
        };
      }
      case "workflow_from_change": {
        const wfc = createWorkflowFromChangeData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...wfc,
          total: wfc.totalChanges,
        };
      }
      case "workflow_to_change": {
        const wtc = createWorkflowToChangeData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...wtc,
          total: wtc.contractIncheiatChangedCount,
        };
      }
      case "ticket_creation": {
        const tc = createTicketCreationData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...tc,
          total: tc.ticketsCreatedCount,
        };
      }
      case "workflow_from_de_prelucrat": {
        const wfdp = createWorkflowFromDePrelucratData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...wfdp,
          total: wfdp.totalChanges,
        };
      }
      case "workflow_duration": {
        const wd = createWorkflowDurationData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...wd,
          total: wd.averageDurationMinutes,
        };
      }
      default: {
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          incoming: Number(r.incoming_calls_count) || 0,
          outgoing: Number(r.outgoing_calls_count) || 0,
          total: Number(r.total_calls_count) || 0,
        };
      }
    }
  });

  return {
    id: "top-users",
    type: "top_users",
    title: getLanguageByKey("Top users"),
    subtitle: getLanguageByKey("By total (desc)"),
    rows,
    bg: BG_COLORS.by_user,
    widgetType,
  };
};

/**
 * Создает виджеты для платформ (messages)
 */
export const createPlatformWidgets = (data, widgetType, getLanguageByKey) => {
  if (widgetType !== "messages") return [];
  
  const platforms = mapPlatforms(data.by_platform);
  return platforms.map((row, idx) => {
    const c = createCountsData(row || {});
    const name = row?.platform || "-";
    return {
      id: `plat-${name ?? idx}`,
      type: "source",
      title: getLanguageByKey("Platform"),
      subtitle: name,
      ...c,
      bg: BG_COLORS.by_source,
    };
  });
};

/**
 * Создает виджеты для источников (calls)
 */
export const createSourceWidgets = (data, getLanguageByKey) => {
  const bySrc = safeArray(data.by_source);
  return bySrc.map((r, idx) => {
    const c = createCountsData(r);
    const name = r.source ?? r.channel ?? r.platform ?? "-";
    return {
      id: `src-${name ?? idx}`,
      type: "source",
      title: getLanguageByKey("Source"),
      subtitle: name || "-",
      ...c,
      bg: BG_COLORS.by_source,
    };
  });
};
