import { useState, useEffect, useCallback } from "react";
import { useSnackbar } from "notistack";
import { api } from "../api";
import { showServerError, getFullName } from "@utils";

const normalizeClientContacts = (ticketData) => {
  if (!ticketData?.clients) return [];
  
  // Собираем уникальные платформы из всех клиентов
  const platforms = new Set();
  
  // Проходим по всем клиентам и собираем платформы
  ticketData.clients.forEach(client => {
    if (client.contacts) {
      client.contacts.forEach(contact => {
        platforms.add(contact.contact_type);
      });
    }
  });
  
  // Создаем опции для каждой платформы
  return Array.from(platforms).map(platform => {
    // Собираем всех клиентов с контактами этой платформы
    const platformClients = ticketData.clients.filter(client => 
      client.contacts?.some(contact => contact.contact_type === platform)
    );
    
    // Создаем все контакты для этой платформы
    const allContacts = platformClients.flatMap(client => 
      client.contacts
        .filter(contact => contact.contact_type === platform)
        .map(contact => ({
          ...contact,
          client_id: client.id,
          client_name: client.name,
          client_surname: client.surname,
          client_photo: client.photo
        }))
    );
    
    return {
      label: platform,
      value: platform,
      payload: {
        platform: platform,
        allContacts: allContacts
      },
    };
  });
};

export const useClientContacts = (ticketId) => {
  const { enqueueSnackbar } = useSnackbar();
  
  const [platformOptions, setPlatformOptions] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [contactOptions, setContactOptions] = useState([]);
  const [selectedClient, setSelectedClient] = useState({});
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState(null);

  const fetchClientContacts = useCallback(async () => {
    if (!ticketId) {
      return;
    }
    
    setLoading(true);
    try {
      // Используем новый API для получения клиентов по платформам
      const response = await api.users.getUsersClientContactsByPlatform(ticketId);
      
      // Нормализуем данные для платформ
      const platforms = normalizeClientContacts(response);
      setPlatformOptions(platforms);
      setTicketData(response);
      
      // Выбираем первую платформу по умолчанию
      if (platforms.length > 0) {
        setSelectedPlatform(platforms[0].value);
      }
      
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [ticketId, enqueueSnackbar]);

  const updateContactOptions = useCallback((platform) => {
    if (!ticketData?.clients) {
      setContactOptions([]);
      return;
    }

    // Собираем всех клиентов с контактами выбранной платформы
    const platformClients = ticketData.clients.filter(client => 
      client.contacts?.some(contact => contact.contact_type === platform)
    );
    
    // Создаем опции контактов для выбранной платформы
    const contacts = platformClients.flatMap(client => 
      client.contacts
        .filter(contact => contact.contact_type === platform)
        .map(contact => {
          const clientName = getFullName(client.name, client.surname) || `#${client.id}`;
          
          // Форматируем лейбл в зависимости от платформы
          let label;
          if (['phone', 'telegram', 'whatsapp', 'viber'].includes(platform)) {
            label = `${platform} - ${clientName} - ${contact.contact_value}${contact.is_primary ? ' (Primary)' : ''}`;
          } else {
            label = `${platform} - ${clientName}${contact.is_primary ? ' (Primary)' : ''}`;
          }
          
          return {
            label,
            value: `${client.id}-${contact.id}`,
            payload: {
              id: client.id,
              contact_id: contact.id,
              platform: platform,
              name: client.name,
              surname: client.surname,
              phone: platform === 'phone' ? contact.contact_value : '',
              email: platform === 'email' ? contact.contact_value : '',
              contact_value: contact.contact_value,
              is_primary: contact.is_primary,
              photo: client.photo
            },
          };
        })
    );
    
    setContactOptions(contacts);
  }, [ticketData]);

  const changePlatform = useCallback((platform) => {
    setSelectedPlatform(platform);
    updateContactOptions(platform);
    setSelectedClient({}); // Сбрасываем выбранный контакт
  }, [updateContactOptions]);

  const changeContact = useCallback((value) => {
    const contact = contactOptions.find(option => option.value === value);
    if (contact) {
      setSelectedClient(contact);
    }
  }, [contactOptions]);

  const updateClientData = useCallback((clientId, platform, newData) => {
    // Обновляем данные в ticketData
    setTicketData(prev => {
      if (!prev?.clients) return prev;
      
      return {
        ...prev,
        clients: prev.clients.map(client => 
          client.id === clientId
            ? {
                ...client,
                name: newData.name || client.name,
                surname: newData.surname || client.surname,
                phone: newData.phone || client.phone,
                email: newData.email || client.email
              }
            : client
        )
      };
    });
    
    // Обновляем selectedClient если это тот же клиент
    setSelectedClient(prev => 
      prev.payload?.id === clientId
        ? { ...prev, payload: { ...prev.payload, ...newData } }
        : prev
    );
  }, []);

  // Обновляем опции контактов при изменении выбранной платформы
  useEffect(() => {
    if (selectedPlatform) {
      updateContactOptions(selectedPlatform);
    }
  }, [selectedPlatform, updateContactOptions]);

  useEffect(() => {
    fetchClientContacts();
  }, [fetchClientContacts]);

  return {
    platformOptions,
    selectedPlatform,
    changePlatform,
    contactOptions,
    changeContact,
    selectedClient,
    loading,
    updateClientData,
    refetch: fetchClientContacts
  };
};
