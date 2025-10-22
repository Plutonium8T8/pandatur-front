import { useState, useEffect, useCallback } from "react";
import { useSnackbar } from "notistack";
import { api } from "../api";
import { showServerError } from "@utils";

const normalizeClientContacts = (ticketData) => {
  if (!ticketData) return [];

  // Собираем уникальные платформы из новой структуры данных
  const platforms = new Set();

  // Проходим по всем платформам в корне объекта
  Object.keys(ticketData).forEach(key => {
    if (key !== 'clients' && typeof ticketData[key] === 'object' && ticketData[key] !== null) {
      // Проверяем, что у платформы есть контакты (не пустой массив)
      const platformData = ticketData[key];
      if (Array.isArray(platformData)) {
        // Если это массив, проверяем что он не пустой
        if (platformData.length > 0) {
          platforms.add(key);
        }
      } else {
        // Если это объект, проверяем что у него есть ключи (контакты)
        if (Object.keys(platformData).length > 0) {
          platforms.add(key);
        }
      }
    }
  });

  // whatsapp и viber уже добавлены в первом проходе

  // Создаем опции для каждой платформы
  return Array.from(platforms).map(platform => {
    // Собираем контакты для этой платформы
    let allContacts = [];

    if (ticketData[platform]) {
      // Для всех платформ используем данные напрямую
      allContacts = Object.entries(ticketData[platform]).map(([contactId, contactData]) => {
        // Находим client_id из массива clients по contact_id
        const client = ticketData.clients?.find(c => 
          c.contacts?.some(contact => contact.id === parseInt(contactId))
        );
        
        return {
          id: contactId,
          contact_type: platform,
          contact_value: contactData.contact_value,
          is_primary: contactData.is_primary || false,
          client_id: client?.id, // используем ID клиента из массива clients
          client_name: contactData.name,
          client_surname: contactData.surname,
          client_photo: client?.photo
        };
      });
    }

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

export const useClientContacts = (ticketId, lastMessage) => {
  const { enqueueSnackbar } = useSnackbar();

  const [platformOptions, setPlatformOptions] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [contactOptions, setContactOptions] = useState([]);
  const [selectedClient, setSelectedClient] = useState({});
  const [selectedPageId, setSelectedPageId] = useState(null);
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
    if (!ticketData) {
      setContactOptions([]);
      return;
    }

    // Собираем контакты для выбранной платформы
    let allContacts = [];

    if (ticketData[platform]) {
      // Для всех платформ используем данные напрямую
      allContacts = Object.entries(ticketData[platform]).map(([contactId, contactData]) => {
        // Находим client_id из массива clients по contact_id
        const client = ticketData.clients?.find(c => 
          c.contacts?.some(contact => contact.id === parseInt(contactId))
        );
        
        return {
          id: contactId,
          contact_type: platform,
          contact_value: contactData.contact_value,
          is_primary: contactData.is_primary || false,
          client_id: client?.id, // используем ID клиента из массива clients
          client_name: contactData.name,
          client_surname: contactData.surname,
          client_photo: client?.photo
        };
      });
    }

    // Создаем опции контактов для выбранной платформы
    const contacts = allContacts.map(contact => {
      // Форматируем лейбл в зависимости от платформы
      let label;
      if (['whatsapp', 'viber', 'telegram'].includes(platform)) {
        // Для WhatsApp, Viber, Telegram: имя фамилия - номер
        const fullName = `${contact.client_name} ${contact.client_surname || ''}`.trim();
        label = `${fullName} - ${contact.contact_value}`;
      } else {
        // Для других платформ: contactId - name - surname
        label = `${contact.id} - ${contact.client_name} ${contact.client_surname || ''}`;
      }

      const payload = {
        id: contact.client_id, // client_id из массива clients
        contact_id: contact.id,
        platform: platform,
        name: contact.client_name,
        surname: contact.client_surname,
        phone: platform === 'phone' ? contact.contact_value : '',
        email: platform === 'email' ? contact.contact_value : '',
        contact_value: contact.contact_value, // ID клиента (куда отправляем)
        is_primary: contact.is_primary,
        photo: contact.client_photo,
        client_id: contact.client_id // явно указываем client_id
      };

      return {
        label,
        value: `${contact.client_id}-${contact.id}`,
        payload,
      };
    });

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

  // Автоматически выбираем платформу, контакт и page_id из последнего сообщения
  useEffect(() => {
    if (!lastMessage || !ticketData || platformOptions.length === 0) return;

    const messagePlatform = lastMessage.platform?.toLowerCase();
    const messageClientId = lastMessage.client_id;
    const messagePageId = lastMessage.page_id;
    
    // Определяем contact_value из сообщения
    let contactValue;
    if (lastMessage.sender_id === lastMessage.client_id) {
      // Входящее сообщение - берем from_reference
      contactValue = lastMessage.from_reference;
    } else {
      // Исходящее сообщение - берем to_reference
      contactValue = lastMessage.to_reference;
    }

    // Устанавливаем платформу если она еще не выбрана
    if (!selectedPlatform && messagePlatform && platformOptions.some(p => p.value === messagePlatform)) {
      setSelectedPlatform(messagePlatform);
    }

    // Устанавливаем контакт если он еще не выбран
    if (selectedPlatform === messagePlatform && contactValue && !selectedClient.payload) {
      // Ищем контакт по contact_value и client_id
      const contact = contactOptions.find(c => 
        c.payload?.contact_value === contactValue && 
        c.payload?.client_id === messageClientId
      );
      
      if (contact) {
        setSelectedClient(contact);
      }
    }

    // Устанавливаем page_id если он еще не выбран
    if (!selectedPageId && messagePageId) {
      setSelectedPageId(messagePageId);
    }
  }, [lastMessage, ticketData, platformOptions, contactOptions, selectedPlatform, selectedClient, selectedPageId]);

  const changePageId = useCallback((pageId) => {
    setSelectedPageId(pageId);
  }, []);

  return {
    platformOptions,
    selectedPlatform,
    changePlatform,
    contactOptions,
    changeContact,
    selectedClient,
    selectedPageId,
    changePageId,
    loading,
    updateClientData,
    refetch: fetchClientContacts
  };
};
