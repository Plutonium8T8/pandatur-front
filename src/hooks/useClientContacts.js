import { useState, useEffect, useCallback } from "react";
import { useSnackbar } from "notistack";
import { api } from "../api";
import { extractNumbers, showServerError, getFullName } from "@utils";

const normalizeClientContacts = (clientData, contactsResponse) => {
  if (!clientData || !contactsResponse) return [];
  
  const { id, name, surname, photo } = clientData;
  
  // Собираем уникальные платформы (типы контактов)
  const platforms = new Set();
  
  // Добавляем платформы из всех массивов контактов
  if (contactsResponse.phones?.length > 0) platforms.add('phone');
  if (contactsResponse.emails?.length > 0) platforms.add('email');
  if (contactsResponse.instagram?.length > 0) platforms.add('instagram');
  if (contactsResponse.facebook?.length > 0) platforms.add('facebook');
  if (contactsResponse.telegram?.length > 0) platforms.add('telegram');
  
  const identifier = getFullName(name, surname) || `#${id}`;
  
  // Создаем опции для каждой платформы
  return Array.from(platforms).map(platform => {
    // Находим основной контакт для этой платформы
    const platformContacts = [
      ...(contactsResponse.phones || []),
      ...(contactsResponse.emails || []),
      ...(contactsResponse.instagram || []),
      ...(contactsResponse.facebook || []),
      ...(contactsResponse.telegram || []),
    ].filter(contact => contact.contact_type === platform);
    
    const primaryContact = platformContacts.find(contact => contact.is_primary) || platformContacts[0];
    
    return {
      label: `${identifier} - ${platform}`,
      value: `${id}-${platform}`,
      payload: {
        id: id,
        platform: platform,
        name: name,
        surname: surname,
        phone: platform === 'phone' ? primaryContact?.contact_value : '',
        email: platform === 'email' ? primaryContact?.contact_value : '',
        contact_value: primaryContact?.contact_value || '',
        is_primary: primaryContact?.is_primary || false,
        photo: photo,
        allContacts: platformContacts // Сохраняем все контакты этой платформы
      },
    };
  });
};

export const useClientContacts = (ticketId, ticketData) => {
  const { enqueueSnackbar } = useSnackbar();
  
  const [clientContacts, setClientContacts] = useState([]);
  const [selectedClient, setSelectedClient] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchClientContacts = useCallback(async () => {
    console.log("🔍 useClientContacts - fetchClientContacts called:", {
      ticketId,
      ticketData,
      client_id: ticketData?.client_id
    });
    
    if (!ticketId) {
      console.log("❌ Missing ticketId:", { ticketId });
      return;
    }
    
    if (!ticketData) {
      console.log("⏳ Ticket data not loaded yet, waiting...");
      return;
    }
    
    // Проверяем, есть ли client_id или clients в тикете
    if (!ticketData.client_id && !ticketData.clients?.length) {
      console.log("❌ No client_id or clients in ticket data:", { 
        ticketData,
        availableKeys: Object.keys(ticketData),
        client_id: ticketData.client_id,
        clients: ticketData.clients
      });
      return;
    }
    
    // Если есть clients в тикете, используем их напрямую
    if (ticketData.clients?.length > 0) {
      console.log("✅ Using clients from ticket data:", ticketData.clients);
      
      setLoading(true);
      try {
        // Загружаем контакты для каждого клиента
        const clientsData = await Promise.all(
          ticketData.clients.map(async (client) => {
            console.log("🔄 Fetching contacts for client:", client.id);
            const contactsResponse = await api.users.getUsersClientContacts(client.id);
            console.log("📊 Client contacts response:", { 
              clientId: client.id, 
              contactsResponse,
              phonesCount: contactsResponse?.phones?.length || 0,
              emailsCount: contactsResponse?.emails?.length || 0,
              instagramCount: contactsResponse?.instagram?.length || 0,
              facebookCount: contactsResponse?.facebook?.length || 0,
              telegramCount: contactsResponse?.telegram?.length || 0
            });
            
            return {
              clientData: client,
              contactsResponse: contactsResponse || {}
            };
          })
        );
        
        // Нормализуем данные для каждого клиента
        const allContacts = clientsData.flatMap(({ clientData, contactsResponse }) => 
          normalizeClientContacts(clientData, contactsResponse)
        );
        
        console.log("🎯 Normalized contacts from ticket clients:", allContacts);
        
        setClientContacts(allContacts);
        
        // Выбираем первого клиента по умолчанию
        if (allContacts.length > 0) {
          console.log("✅ Setting first client as selected:", allContacts[0]);
          setSelectedClient(allContacts[0]);
        } else {
          console.log("❌ No contacts found after normalization");
        }
        
      } catch (error) {
        enqueueSnackbar(showServerError(error), {
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
      return;
    }
    
    setLoading(true);
    try {
      // Извлекаем ID клиентов из тикета
      const clientIds = extractNumbers(ticketData.client_id);
      console.log("📋 Extracted client IDs:", clientIds);
      
      if (clientIds.length === 0) {
        console.log("❌ No client IDs found in:", ticketData.client_id);
        return;
      }
      
      // Загружаем данные клиентов и их контакты
      const clientsData = await Promise.all(
        clientIds.map(async (clientId) => {
          console.log("🔄 Fetching data for client ID:", clientId);
          const [clientData, contactsResponse] = await Promise.all([
            api.users.getUsersClientById(clientId),
            api.users.getUsersClientContacts(clientId)
          ]);
          
          console.log("📊 Client data:", { 
            clientId, 
            clientData, 
            contactsResponse,
            phonesCount: contactsResponse?.phones?.length || 0,
            emailsCount: contactsResponse?.emails?.length || 0,
            instagramCount: contactsResponse?.instagram?.length || 0,
            facebookCount: contactsResponse?.facebook?.length || 0,
            telegramCount: contactsResponse?.telegram?.length || 0
          });
          
          return {
            clientData,
            contactsResponse: contactsResponse || {}
          };
        })
      );
      
      // Нормализуем данные для каждого клиента
      const allContacts = clientsData.flatMap(({ clientData, contactsResponse }) => 
        normalizeClientContacts(clientData, contactsResponse)
      );
      
      console.log("🎯 Normalized contacts:", allContacts);
      
      setClientContacts(allContacts);
      
      // Выбираем первого клиента по умолчанию
      if (allContacts.length > 0) {
        console.log("✅ Setting first client as selected:", allContacts[0]);
        setSelectedClient(allContacts[0]);
      } else {
        console.log("❌ No contacts found after normalization");
      }
      
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [ticketId, ticketData, enqueueSnackbar]);

  const changeClient = useCallback((value) => {
    // value теперь в формате "clientId-platform"
    const client = clientContacts.find(
      ({ value: clientValue }) => clientValue === value
    );
    
    if (client) {
      setSelectedClient(client);
    }
  }, [clientContacts]);

  const updateClientData = useCallback((clientId, platform, newData) => {
    setClientContacts(prev => 
      prev.map(client => 
        client.payload.id === clientId && client.payload.platform === platform
          ? {
              ...client,
              payload: { ...client.payload, ...newData }
            }
          : client
      )
    );
    
    // Обновляем selectedClient если это тот же клиент
    setSelectedClient(prev => 
      prev.payload.id === clientId && prev.payload.platform === platform
        ? { ...prev, payload: { ...prev.payload, ...newData } }
        : prev
    );
  }, []);

  useEffect(() => {
    console.log("🔄 useClientContacts useEffect triggered:", { ticketId, ticketData });
    fetchClientContacts();
  }, [fetchClientContacts, ticketId, ticketData]);

  return {
    clientContacts,
    selectedClient,
    loading,
    changeClient,
    updateClientData,
    refetch: fetchClientContacts
  };
};
