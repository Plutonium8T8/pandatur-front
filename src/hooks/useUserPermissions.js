import { useState, useEffect, useMemo } from "react";
import { api } from "@api";
import { useGetTechniciansList } from "./useGetTechniciansList";
import { 
  userGroupsToGroupTitle, 
  workflowOptionsByGroupTitle, 
  workflowOptionsLimitedByGroupTitle 
} from "../Components/utils/workflowUtils";

export const useUserPermissions = () => {
  const [userGroups, setUserGroups] = useState([]);
  const [allUserGroups, setAllUserGroups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { technicians } = useGetTechniciansList();

  // Получаем ID текущего пользователя
  const currentUserId = useMemo(() => {
    const savedUserId = localStorage.getItem("user_id");
    return savedUserId ? Number(savedUserId) : null;
  }, []);

  // Загружаем данные о пользователе и группах
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Загружаем данные текущего пользователя
        const userData = await api.users.getById(currentUserId);
        console.log("🔍 Raw user data from API:", userData);
        setCurrentUser(userData);

        // Загружаем все группы пользователей
        const allGroups = await api.user.getGroupsList();
        setAllUserGroups(allGroups || []);

        // Находим группы, в которых состоит текущий пользователь
        const myGroups = (allGroups || []).filter(group => 
          (group.users || []).includes(currentUserId)
        );
        setUserGroups(myGroups);

      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUserId]);

  // Определяем роли и статусы пользователя
  const userPermissions = useMemo(() => {
    if (!currentUserId || !userGroups.length || !allUserGroups.length) {
      return {
        userId: currentUserId,
        isLoading: loading,
        error,
        isAdmin: false,
        isITDep: false,
        isTeamLeader: false,
        userRole: 'Unknown',
        accessibleGroupTitles: [],
        accessibleWorkflows: [],
        supervisedGroups: [],
        allGroups: [],
        myGroups: [],
        teamUserIds: new Set(),
        userName: null,
        userSurname: null,
        fullName: null,
      };
    }


    // Находим данные текущего пользователя в списке technicians
    const currentUserFromTechnicians = technicians?.find(tech => 
      tech.value === String(currentUserId)
    );
    
    console.log("🔍 Current user from technicians:", currentUserFromTechnicians);

    // Проверяем, является ли пользователь Admin
    const isAdmin = userGroups.some(group => 
      ["Admin", "IT dep.", "Quality Department"].includes(group.name)
    );

    // Проверяем, является ли пользователь IT dep.
    const isITDep = userGroups.some(group => group.name === "IT dep.");

    // Определяем, является ли пользователь Team Leader
    const supervisedGroups = allUserGroups.filter(group => 
      group.supervisor_id === currentUserId
    );
    const isTeamLeader = supervisedGroups.length > 0;

    // Определяем роль пользователя
    const userRole = isAdmin ? 'Admin' : 
                    isITDep ? 'IT dep.' : 
                    isTeamLeader ? 'Team Leader' : 
                    'Regular User';

    // Получаем доступные воронки (group titles)
    const accessibleGroupTitles = userGroups.flatMap(group => 
      userGroupsToGroupTitle[group.name] || []
    );
    const uniqueGroupTitles = [...new Set(accessibleGroupTitles)];

    // Получаем доступные workflow
    const accessibleWorkflows = uniqueGroupTitles.flatMap(groupTitle => {
      if (isAdmin || isITDep) {
        return workflowOptionsByGroupTitle[groupTitle] || [];
      } else {
        return workflowOptionsLimitedByGroupTitle[groupTitle] || [];
      }
    });
    const uniqueWorkflows = [...new Set(accessibleWorkflows)];

    // Получаем ID всех пользователей в команде
    const teamUserIds = new Set();
    userGroups.forEach(group => {
      if (group.users) {
        group.users.forEach(userId => teamUserIds.add(String(userId)));
      }
    });

    return {
      userId: currentUserId,
      isLoading: loading,
      error,
      isAdmin,
      isITDep,
      isTeamLeader,
      userRole,
      accessibleGroupTitles: uniqueGroupTitles,
      accessibleWorkflows: uniqueWorkflows,
      supervisedGroups,
      allGroups: allUserGroups,
      myGroups: userGroups,
      teamUserIds,
      currentUser,
      // Имя и фамилия пользователя (из technicians, где есть правильная структура)
      userName: currentUserFromTechnicians?.id?.name || null,
      userSurname: currentUserFromTechnicians?.id?.surname || null,
      fullName: currentUserFromTechnicians?.id ? `${currentUserFromTechnicians.id.surname || ''} ${currentUserFromTechnicians.id.name || ''}`.trim() : null,
    };
  }, [
    currentUserId, 
    userGroups, 
    allUserGroups, 
    loading, 
    error,
    currentUser,
    technicians
  ]);

  // Логируем данные для отладки
  useEffect(() => {
    if (!loading && currentUserId && userGroups.length > 0) {
      console.log("🔍 User Permissions Analysis:", {
        userId: userPermissions.userId,
        userName: userPermissions.userName,
        userSurname: userPermissions.userSurname,
        fullName: userPermissions.fullName,
        userRole: userPermissions.userRole,
        isAdmin: userPermissions.isAdmin,
        isITDep: userPermissions.isITDep,
        isTeamLeader: userPermissions.isTeamLeader,
        myGroups: userPermissions.myGroups.map(g => ({
          id: g.id,
          name: g.name,
          supervisor_id: g.supervisor_id,
          usersCount: g.users?.length || 0
        })),
        supervisedGroups: userPermissions.supervisedGroups.map(g => ({
          id: g.id,
          name: g.name,
          usersCount: g.users?.length || 0
        })),
        accessibleGroupTitles: userPermissions.accessibleGroupTitles,
        accessibleWorkflows: userPermissions.accessibleWorkflows,
        teamUserIds: Array.from(userPermissions.teamUserIds),
        totalGroupsInSystem: userPermissions.allGroups.length,
        techniciansCount: technicians?.length || 0
      });
    }
  }, [userPermissions, loading, technicians, currentUserId, userGroups.length]);

  return userPermissions;
};
