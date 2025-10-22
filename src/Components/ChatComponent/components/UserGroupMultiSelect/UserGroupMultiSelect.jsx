import React, { useState, useMemo, useEffect } from "react";
import { MultiSelect, Group, Text, Badge, Box } from "@mantine/core";
import { FaUsers, FaUser, FaCheck } from "react-icons/fa";
import { useUser } from "@hooks";

export const UserGroupMultiSelect = ({
  value = [],
  onChange = () => { },
  placeholder = "Select users and groups",
  label = "Users & Groups",
  usersData = [], // Данные пользователей из API (raw data)
  techniciansData = [], // Данные из useGetTechniciansList (formatted)
  mode = "multi", // "multi" или "single"
  allowedUserIds = null, // Set с разрешенными ID пользователей для фильтрации
  disabled = false
}) => {
  const [selectedValues, setSelectedValues] = useState(value);
  const { userGroups } = useUser();

  // Синхронизируем selectedValues с внешним value
  useEffect(() => {
    setSelectedValues(value);
  }, [value]);

  // Определяем placeholder в зависимости от режима
  const actualPlaceholder = mode === "single"
    ? (placeholder === "Select users and groups" ? "Select user" : placeholder)
    : placeholder;

  // Создаем опции для мультиселекта из реальных данных
  const options = useMemo(() => {
    // Если есть отформатированные данные из useGetTechniciansList, используем их
    if (techniciansData && techniciansData.length > 0) {
      return techniciansData
        .filter(item => {
          // Если есть фильтрация по allowedUserIds
          if (allowedUserIds && !item.value.startsWith("__group__")) {
            return allowedUserIds.has(item.value);
          }
          return true;
        })
        .map(item => {
          const isGroup = item.value.startsWith("__group__");

          // В режиме single отключаем группы
          if (isGroup) {
            return {
              ...item,
              disabled: mode === "single"
            };
          } else {
            // Для пользователей проверяем фильтрацию и обновляем label
            if (allowedUserIds && !allowedUserIds.has(item.value)) {
              return {
                ...item,
                disabled: true
              };
            }

            // Обновляем label с ID техника и SIP ID
            let enhancedLabel = item.label;
            if (item.sipuni_id || item.id) {
              const sipuniId = item.sipuni_id ? ` (SIP: ${item.sipuni_id})` : '';
              const technicianId = item.id ? ` (ID: ${item.id})` : '';
              enhancedLabel = item.label + sipuniId + technicianId;
            }

            return {
              ...item,
              label: enhancedLabel,
              disabled: false
            };
          }
        });
    }

    // Если есть raw данные пользователей из API, используем их (показываем ВСЕ группы)
    if (usersData && usersData.length > 0) {
      // Собираем все уникальные группы из данных пользователей
      const allGroups = new Map();
      usersData.forEach(user => {
        if (user.groups && user.groups.length > 0) {
          user.groups.forEach(group => {
            if (!allGroups.has(group.id)) {
              allGroups.set(group.id, {
                id: group.id,
                name: group.name,
                users: []
              });
            }
            // Используем user.id напрямую, так как в новой структуре это уже ID пользователя
            allGroups.get(group.id).users.push(user.id);
          });
        }
      });

      // Создаем опции в формате как в существующей системе
      const options = [];

      // Добавляем группы и пользователей
      Array.from(allGroups.values()).forEach(group => {
        // Добавляем группу
        options.push({
          value: `__group__${group.id}`,
          label: group.name,
          disabled: mode === "single"
        });

        // Добавляем пользователей этой группы
        const groupUsers = usersData.filter(user =>
          user.groups && user.groups.some(g => g.id === group.id)
        );

        groupUsers.forEach(user => {
          const name = `${user.name} ${user.surname}`.trim();
          const sipuniId = user.sipuni_id ? ` (SIP: ${user.sipuni_id})` : '';
          const userId = ` (ID: ${user.id})`;

          options.push({
            value: String(user.id),
            label: `${name}${sipuniId}${userId}`
          });
        });
      });

      return options;
    }

    // Fallback: используем данные из UserContext (только группы текущего пользователя)
    if (userGroups && userGroups.length > 0) {
      const groupOptions = userGroups.map(group => ({
        value: `__group__${group.id}`,
        label: group.name,
        isGroup: true,
        groupId: group.id,
        userCount: group.users?.length || 0,
        disabled: mode === "single"
      }));

      // Собираем всех пользователей из всех групп
      const allUsers = userGroups.flatMap(group =>
        (group.users || []).map(userId => ({
          id: userId,
          groupId: group.id,
          groupName: group.name,
          name: `User ${userId}`
        }))
      );

      const userOptions = allUsers.map(user => ({
        value: String(user.id),
        label: `${user.name} (ID: ${user.id})`,
        isGroup: false,
        userId: user.id,
        groupId: user.groupId,
        groupName: user.groupName
      }));

      return [...groupOptions, ...userOptions];
    }

    // Если нет данных - возвращаем пустой массив
    return [];
  }, [userGroups, usersData, techniciansData, mode, allowedUserIds]);

  const handleChange = (newValues) => {
    // В режиме single ограничиваем выбор одним пользователем
    if (mode === "single") {
      const lastValue = newValues[newValues.length - 1];
      // Проверяем, что выбранный элемент не является группой
      if (lastValue?.startsWith("__group__")) {
        return; // Игнорируем выбор групп в режиме single
      }
      // Оставляем только последний выбранный пользователь
      const singleValue = [lastValue].filter(Boolean);
      setSelectedValues(singleValue);
      onChange(singleValue);
      return;
    }

    // Режим multi - используем существующую логику
    const last = newValues[newValues.length - 1];
    const isGroup = last?.startsWith("__group__");

    if (isGroup) {
      // Если выбрана группа, добавляем или убираем всех пользователей из группы
      const groupId = last.replace("__group__", "");

      // Находим всех пользователей из этой группы
      let groupUsers = [];
      
      // Сначала пробуем найти в techniciansData
      if (techniciansData && techniciansData.length > 0) {
        groupUsers = techniciansData
          ?.filter(item => {
            // Пропускаем группы, берем только пользователей
            if (item.value.startsWith("__group__")) return false;
            // Проверяем, принадлежит ли пользователь к выбранной группе
            return item.groupName && item.groupName === techniciansData.find(g => g.value === `__group__${groupId}`)?.label;
          })
          ?.map(item => item.value) || [];
      }
      
      // Если не нашли в techniciansData, пробуем в usersData
      if (groupUsers.length === 0 && usersData && usersData.length > 0) {
        groupUsers = usersData
          .filter(user => user.groups && user.groups.some(g => g.id === groupId))
          .map(user => String(user.id));
      }
      
      // Если не нашли в usersData, пробуем в userGroups (fallback)
      if (groupUsers.length === 0 && userGroups && userGroups.length > 0) {
        const group = userGroups.find(g => g.id === groupId);
        if (group && group.users) {
          groupUsers = group.users.map(userId => String(userId));
        }
      }

      const current = selectedValues || [];

      // Проверяем, были ли уже выбраны пользователи этой группы
      const groupUsersSelected = groupUsers.every(userId => current.includes(userId));

      let newSelection;
      if (groupUsersSelected) {
        // Если группа уже была выбрана - убираем всех её пользователей
        newSelection = current.filter(userId => !groupUsers.includes(userId));
      } else {
        // Если группа не была выбрана - добавляем всех её пользователей
        newSelection = Array.from(new Set([...current, ...groupUsers]));
      }

      setSelectedValues(newSelection);
      onChange(newSelection);
    } else {
      // Обычный выбор пользователя
      setSelectedValues(newValues);
      onChange(newValues);
    }
  };


  // Рендер элемента в выпадающем списке
  const renderOption = ({ option, checked }) => {
    const isGroup = option.value.startsWith("__group__");
    const isDisabled = option.disabled;

    return (
      <Group
        gap="xs"
        style={{
          padding: '8px 12px',
          opacity: isDisabled ? 0.7 : 1,
          backgroundColor: checked ? "var(--crm-ui-kit-palette-surface-hover-background-color)" : "transparent",
          border: checked ? "1px solid var(--crm-ui-kit-palette-link-primary)" : "1px solid transparent",
          borderRadius: checked ? "6px" : "4px",
          cursor: isDisabled ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          position: "relative"
        }}
        onMouseEnter={(e) => {
          if (!isDisabled && !checked) {
            e.currentTarget.style.backgroundColor = "var(--crm-ui-kit-palette-button-classic-hover-background)";
            e.currentTarget.style.border = "1px solid var(--crm-ui-kit-palette-border-default)";
          }
        }}
        onMouseLeave={(e) => {
          if (!checked) {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.border = "1px solid transparent";
          }
        }}
      >
        {/* Чекбокс для выбранных элементов */}
        {checked && (
          <Box
            style={{
              position: "absolute",
              left: "4px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "16px",
              height: "16px",
              backgroundColor: "var(--crm-ui-kit-palette-link-primary)",
              borderRadius: "3px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1
            }}
          >
            <FaCheck size={10} color="white" />
          </Box>
        )}

        {/* Отступ для чекбокса */}
        <Box style={{ width: checked ? "24px" : "0px", transition: "width 0.2s ease" }} />

        {isGroup ? (
          <FaUsers size={14} style={{ color: checked ? "var(--crm-ui-kit-palette-link-primary)" : "#4caf50" }} />
        ) : (
          <FaUser size={12} style={{ color: checked ? "var(--crm-ui-kit-palette-link-primary)" : "var(--crm-ui-kit-palette-text-secondary-light)" }} />
        )}
        <Box style={{ flex: 1 }}>
          <Text
            size="sm"
            fw={isGroup ? 600 : 400}
            style={{
              color: checked ? "var(--crm-ui-kit-palette-link-primary)" : (isGroup ? "#4caf50" : "var(--crm-ui-kit-palette-text-primary)"),
              fontWeight: checked ? 600 : (isGroup ? 600 : 400)
            }}
          >
            {option.label}
          </Text>
        </Box>
        {isGroup && (
          <Badge
            size="xs"
            variant={checked ? "filled" : "light"}
            color={checked ? "blue" : "green"}
          >
            {(() => {
              const groupId = option.value.replace("__group__", "");
              let userCount = 0;
              
              // Считаем пользователей в группе из разных источников данных
              if (techniciansData && techniciansData.length > 0) {
                const groupName = techniciansData.find(g => g.value === `__group__${groupId}`)?.label;
                userCount = techniciansData.filter(item => {
                  return !item.value.startsWith("__group__") && item.groupName === groupName;
                }).length;
              } else if (usersData && usersData.length > 0) {
                userCount = usersData.filter(user => 
                  user.groups && user.groups.some(g => g.id === groupId)
                ).length;
              } else if (userGroups && userGroups.length > 0) {
                const group = userGroups.find(g => g.id === groupId);
                userCount = group?.users?.length || 0;
              }
              
              return `${userCount} users`;
            })()}
          </Badge>
        )}
      </Group>
    );
  };


  return (
    <Box>
      <MultiSelect
        label={label}
        placeholder={actualPlaceholder}
        value={selectedValues}
        onChange={handleChange}
        data={options}
        searchable
        clearable
        hidePickedOptions={false}
        renderOption={renderOption}
        disabled={disabled}
        styles={{
          label: { fontSize: 13, fontWeight: 500, marginBottom: 8 },
          input: {
            borderRadius: 4,
            fontSize: 14,
            minHeight: "36px"
          },
          dropdown: {
            borderRadius: 8,
            boxShadow: "0 4px 6px -1px var(--crm-ui-kit-palette-box-shadow-default)"
          },
          option: {
            padding: 0
          },
          pill: {
            backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)",
            color: "var(--crm-ui-kit-palette-text-primary)",
            border: "1px solid var(--crm-ui-kit-palette-border-default)",
            fontWeight: 600
          }
        }}
      />
    </Box>
  );
};
