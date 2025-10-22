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
      allContacts = Object.entries(ticketData[platform]).map(([contactId, contactData]) => ({
        id: contactId,
        contact_type: platform,
        contact_value: contactData.contact_value,
        is_primary: contactData.is_primary || false,
        client_id: contactData.client_id,
        client_name: contactData.name,
        client_surname: contactData.surname,
        client_photo: contactData.photo
      }));
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
    if (!ticketData) {
      setContactOptions([]);
      return;
    }

    // Собираем контакты для выбранной платформы
    let allContacts = [];

    if (ticketData[platform]) {
      // Для всех платформ используем данные напрямую
      allContacts = Object.entries(ticketData[platform]).map(([contactId, contactData]) => ({
        id: contactId,
        contact_type: platform,
        contact_value: contactData.contact_value,
        is_primary: contactData.is_primary || false,
        client_id: contactData.client_id,
        client_name: contactData.name,
        client_surname: contactData.surname,
        client_photo: contactData.photo
      }));
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

      return {
        label,
        value: `${contact.client_id}-${contact.id}`,
        payload: {
          id: contact.client_id,
          contact_id: contact.id,
          platform: platform,
          name: contact.client_name,
          surname: contact.client_surname,
          phone: platform === 'phone' ? contact.contact_value : '',
          email: platform === 'email' ? contact.contact_value : '',
          contact_value: contact.contact_value,
          is_primary: contact.is_primary,
          photo: contact.client_photo,
          page_id: contact.contact_value // page_id это contact_value для социальных платформ
        },
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
