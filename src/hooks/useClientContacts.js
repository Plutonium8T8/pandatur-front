import { useState, useEffect, useCallback } from "react";
import { useSnackbar } from "notistack";
import { api } from "../api";
import { showServerError } from "@utils";
import { getPagesByType } from "../constants/webhookPagesConfig";

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
    console.log('🔄 updateContactOptions called:', {
      platform,
      hasTicketData: !!ticketData,
      platformData: ticketData?.[platform],
      ticketDataKeys: ticketData ? Object.keys(ticketData) : []
    });

    if (!ticketData) {
      console.log('⚠️ No ticketData, clearing contact options');
      setContactOptions([]);
      return;
    }

    // Собираем контакты для выбранной платформы
    let allContacts = [];

    if (ticketData[platform]) {
      console.log(`✅ Found platform data for ${platform}:`, ticketData[platform]);
      
      // Для всех платформ используем данные напрямую
      allContacts = Object.entries(ticketData[platform]).map(([contactId, contactData]) => {
        // Находим client_id из массива clients по contact_id
        const client = ticketData.clients?.find(c => 
          c.contacts?.some(contact => contact.id === parseInt(contactId))
        );
        
        console.log(`  Contact ${contactId}:`, {
          contactData,
          foundClient: client?.id,
          clientName: contactData.name
        });
        
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
    } else {
      console.log(`⚠️ No data found for platform: ${platform}`);
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

    console.log(`📋 Setting ${contacts.length} contact options for ${platform}:`, contacts);
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

  // Сбрасываем состояние при изменении ticketId
  useEffect(() => {
    console.log('🔄 TicketId changed, resetting state:', ticketId);
    setSelectedPlatform(null);
    setContactOptions([]);
    setSelectedClient({});
    setSelectedPageId(null);
    setTicketData(null); // Также сбрасываем ticketData
    setPlatformOptions([]); // Сбрасываем platformOptions
  }, [ticketId]);

  // Автоматически выбираем платформу, контакт и page_id из последнего сообщения
  useEffect(() => {
    if (!lastMessage || !ticketData || platformOptions.length === 0) {
      console.log('🔴 Auto-select skipped:', { 
        hasLastMessage: !!lastMessage, 
        hasTicketData: !!ticketData, 
        platformOptionsLength: platformOptions.length 
      });
      return;
    }

    // КРИТИЧНО: Проверяем что сообщение принадлежит текущему тикету
    if (lastMessage.ticket_id !== ticketId) {
      console.log('⚠️ Last message belongs to different ticket!', {
        messageTicketId: lastMessage.ticket_id,
        currentTicketId: ticketId
      });
      return;
    }

    console.log('📨 Last message structure:', {
      id: lastMessage.id,
      ticket_id: lastMessage.ticket_id,
      platform: lastMessage.platform,
      client_id: lastMessage.client_id,
      sender_id: lastMessage.sender_id,
      from_reference: lastMessage.from_reference,
      to_reference: lastMessage.to_reference,
      page_id: lastMessage.page_id,
      message: lastMessage.message?.substring(0, 50)
    });

    const messagePlatform = lastMessage.platform?.toLowerCase();
    const messageClientId = lastMessage.client_id;
    const messagePageId = lastMessage.page_id;
    
    // Определяем contact_value из сообщения
    let contactValue;
    if (lastMessage.sender_id === lastMessage.client_id) {
      // Входящее сообщение - берем from_reference
      contactValue = lastMessage.from_reference;
      console.log('📥 Incoming message, using from_reference:', contactValue);
    } else {
      // Исходящее сообщение - берем to_reference
      contactValue = lastMessage.to_reference;
      console.log('📤 Outgoing message, using to_reference:', contactValue);
    }
    
    // Если contactValue все еще null, пытаемся найти контакт клиента по client_id
    if (!contactValue && messageClientId && ticketData?.[messagePlatform]) {
      console.log('⚠️ contactValue is null, trying to find contact by client_id:', messageClientId);
      
      // Ищем контакт в данных платформы
      const platformContacts = ticketData[messagePlatform];
      const contactEntry = Object.entries(platformContacts).find(([contactId, contactData]) => {
        const client = ticketData.clients?.find(c => 
          c.contacts?.some(contact => contact.id === parseInt(contactId))
        );
        return client?.id === messageClientId;
      });
      
      if (contactEntry) {
        contactValue = contactEntry[1].contact_value;
        console.log('✅ Found contactValue by client_id:', contactValue);
      } else {
        console.log('❌ Could not find contact for client_id:', messageClientId);
      }
    }

    console.log('🟢 Auto-select data:', {
      messagePlatform,
      messageClientId,
      messagePageId,
      contactValue,
      selectedPlatform,
      contactOptionsLength: contactOptions.length,
      selectedClientValue: selectedClient.value
    });

    // 1. Устанавливаем платформу
    if (messagePlatform && platformOptions.some(p => p.value === messagePlatform)) {
      if (selectedPlatform !== messagePlatform) {
        console.log('✅ Setting platform:', messagePlatform);
        setSelectedPlatform(messagePlatform);
      }
    }

    // 2. Устанавливаем page_id (только если он есть в конфигурации)
    if (messagePageId && !selectedPageId && messagePlatform) {
      // Проверяем, что page_id существует в конфигурации для данной платформы
      const availablePages = getPagesByType(messagePlatform);
      const pageExists = availablePages.some(p => p.page_id === messagePageId);
      
      console.log('🔍 Checking page_id:', {
        messagePageId,
        platform: messagePlatform,
        availablePagesCount: availablePages.length,
        pageExists
      });
      
      if (pageExists) {
        console.log('✅ Setting page_id from message:', messagePageId);
        setSelectedPageId(messagePageId);
      } else {
        console.log('⚠️ Page ID not found in config, using first available page');
        // Если page_id из сообщения нет в конфиге, берем первый доступный
        if (availablePages.length > 0) {
          setSelectedPageId(availablePages[0].page_id);
        }
      }
    } else if (messagePageId && selectedPageId !== messagePageId) {
      console.log('⚠️ Page ID already set or platform not ready:', {
        currentPageId: selectedPageId,
        messagePageId: messagePageId,
        platformReady: !!messagePlatform
      });
    }

    // 3. Устанавливаем контакт (только после того, как платформа установлена и contactOptions обновлены)
    if (selectedPlatform === messagePlatform && contactValue && contactOptions.length > 0) {
      console.log('🔍 Searching for contact:', { 
        contactValue, 
        messageClientId,
        contactOptionsLength: contactOptions.length,
        allContactOptions: contactOptions.map(c => ({
          value: c.value,
          label: c.label,
          contact_value: c.payload?.contact_value,
          client_id: c.payload?.client_id
        }))
      });
      
      // Ищем контакт по contact_value и client_id
      const contact = contactOptions.find(c => 
        c.payload?.contact_value === contactValue && 
        c.payload?.client_id === messageClientId
      );
      
      console.log('🔍 Found contact:', contact);
      
      if (contact && selectedClient.value !== contact.value) {
        console.log('✅ Setting contact:', contact.value);
        setSelectedClient(contact);
      } else if (!contact) {
        console.log('❌ Contact not found! Trying to match by contact_value only...');
        const contactByValue = contactOptions.find(c => 
          c.payload?.contact_value === contactValue
        );
        console.log('🔍 Found by contact_value only:', contactByValue);
        
        if (contactByValue && selectedClient.value !== contactByValue.value) {
          console.log('✅ Setting contact (by contact_value only):', contactByValue.value);
          setSelectedClient(contactByValue);
        }
      }
    } else {
      console.log('⚠️ Contact selection conditions not met:', {
        platformMatch: selectedPlatform === messagePlatform,
        hasContactValue: !!contactValue,
        hasContactOptions: contactOptions.length > 0,
        selectedPlatform,
        messagePlatform
      });
    }
  }, [lastMessage, ticketData, platformOptions, contactOptions, selectedPlatform, selectedClient.value, selectedPageId, ticketId]);

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
