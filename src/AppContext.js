import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import Cookies from 'js-cookie';
import { useSnackbar } from 'notistack';
import { FaEnvelope, FaTrash } from 'react-icons/fa';
import { useUser } from './UserContext';
import { truncateText } from './stringUtils';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children, isLoggedIn }) => {
  const socketRef = useRef(null); // Вместо useState
  const [tickets, setTickets] = useState([]);
  const [ticketIds, setTicketIds] = useState([]);
  const [messages, setMessages] = useState([]); // Все сообщения
  const [clientMessages, setClientMessages] = useState([]); // Сообщения клиента из API
  const [unreadCount, setUnreadCount] = useState(0); // Непрочитанные сообщения
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const { userId } = useUser(); // Получаем userId из UserContext
  const ticketsRef = useRef(tickets);
  const [unreadMessages, setUnreadMessages] = useState(new Map()); // Оптимизированное хранение непрочитанных сообщений

  useEffect(() => {
    let pingInterval;

    if (socketRef.current) {
      // Отправка пинга через каждые 4 минуты
      pingInterval = setInterval(() => {
        if (socketRef.current.readyState === WebSocket.OPEN) {
          const pingMessage = JSON.stringify({ type: 'ping' });
          socketRef.current.send(pingMessage);
        }
      }, 5000); // Пинг каждые 4 минуты

      // Очистка интервала при размонтировании компонента или закрытии сокета
      return () => {
        clearInterval(pingInterval);
        if (socketRef.current) {
          socketRef.current.onmessage = null; // Очищаем обработчик сообщений
        }
      };
    }

    return () => { }; // Очистка, если сокет не подключен
  }, []); // useEffect без зависимости от socket, поскольку socketRef.current всегда актуален

  // Инициализация WebSocket и подключение к чат-румам при логине
  useEffect(() => {
    if (!isLoggedIn) {
      setTickets([]);
      setTicketIds([]);
      setMessages([]);
      setUnreadCount(0);
      setClientMessages([]);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    const connectToChatRooms = (ticketIds) => {
      const socketInstance = socketRef.current; // Используем socketRef.current
      if (!socketInstance || socketInstance.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket не подключён или недоступен.');
        return;
      }

      if (!ticketIds || ticketIds.length === 0) {
        console.warn('Нет id для подключения к комнатам.');
        return;
      }

      const socketMessage = JSON.stringify({
        type: 'connect',
        data: { ticket_id: ticketIds },
      });

      socketInstance.send(socketMessage);
      // console.log('Подключён к комнатам клиентов:', ticketIds);
    };

    if (!socketRef.current) {
      const socketInstance = new WebSocket('wss://pandaturws.com');
      socketRef.current = socketInstance;

      socketInstance.onopen = async () => {
        console.log('WebSocket подключен');
        const tickets = await fetchTickets();
        const ticketIds = tickets.map((ticket) => ticket.id);
        connectToChatRooms(ticketIds);
      };

      socketInstance.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      socketInstance.onclose = () => console.warn('WebSocket закрыт');
      socketInstance.onerror = (error) => console.error('WebSocket ошибка:', error);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [isLoggedIn]);

  useEffect(() => {
    console.log("Количество непрочитанных сообщений:", unreadCount);
    // Здесь можно выполнить любое действие при изменении unreadCount
  }, [unreadCount]);


  const updateUnreadMessages = (newMessages) => {
    const unread = newMessages.filter(
      (msg) =>
        msg.seen_by != null && msg.seen_by == '{}' && msg.sender_id == msg.client_id

    );
    // console.log("Все сообщения:", newMessages);
    // console.log("Непрочитанные сообщения:", unread);
    // console.log("Количество непрочитанных:", unread.length);

    setUnreadCount(unread.length); // Обновляем глобальный счетчик
  };


  const markMessagesAsRead = (clientId) => {
    setMessages((prevMessages) => {
      const updatedMessages = prevMessages.map((msg) =>
        msg.client_id === clientId && (!msg.seen_by || msg.seen_by === '{}')
          ? { ...msg, seen_by: `{${userId}}`, seen_at: new Date().toISOString() }
          : msg
      );

      // Удаляем прочитанные сообщения из `unreadMessages`
      const updatedUnreadMap = new Map(unreadMessages);
      updatedMessages.forEach((msg) => {
        if (msg.client_id === clientId && msg.seen_by !== '{}') {
          updatedUnreadMap.delete(msg.id);
        }
      });
      console.log("Обновленные сообщения после чтения:", updatedMessages);


      setUnreadMessages(updatedUnreadMap);
      return updatedMessages;
    });
  };

  // Функция загрузки тикетов
  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get('jwt');

      if (!token) {
        console.warn('Нет токена. Пропускаем загрузку тикетов.');
        return [];
      }
      // await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await fetch('https://pandatur-api.com/tickets', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Origin: 'https://plutonium8t8.github.io'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Ошибка при получении тикетов. Код статуса: ${response.status}`);
      }

      const data = await response.json();
      // console.log("Загруженные тикеты:", data);

      setTickets(data); // Сохраняем тикеты в состоянии
      setTicketIds(data.map((ticket) => ticket.id)); // Сохраняем ticket.id

      return data; // Возвращаем массив тикетов
    } catch (error) {
      console.error('Ошибка при загрузке тикетов:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSingleTicket = async (ticketId) => {
    try {
      setIsLoading(true);
      const token = Cookies.get('jwt');

      if (!token) {
        console.warn('Нет токена. Пропускаем загрузку тикета.');
        return null;
      }

      const response = await fetch(`https://pandatur-api.com/tickets/${ticketId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Origin: 'https://plutonium8t8.github.io'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Ошибка при получении тикета. Код статуса: ${response.status}`);
      }

      const ticket = await response.json();
      console.log('Загруженный тикет:', ticket);

      // Обновляем или добавляем тикет в состояние
      setTickets((prevTickets) => {
        const existingTicket = prevTickets.find((t) => t.id === ticketId);
        if (existingTicket) {
          // Обновляем существующий тикет
          return prevTickets.map((t) =>
            t.id === ticketId ? ticket : t
          );
        } else {
          // Добавляем новый тикет
          return [...prevTickets, ticket];
        }
      });

      return ticket; // Возвращаем полученный тикет
    } catch (error) {
      console.error('Ошибка при загрузке тикета:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTicket = async (updateData) => {
    try {
      const token = Cookies.get('jwt');
      if (!token) {
        throw new Error('Token is missing. Authorization required.');
      }

      const response = await fetch(`https://pandatur-api.com/tickets/${updateData.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Origin: 'https://plutonium8t8.github.io'
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(
          `Error updating ticket: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorDetails)}`
        );
      }

      const updatedTicket = await response.json();

      // Синхронизация тикетов через WebSocket
      return updatedTicket;
    } catch (error) {
      console.error('Error updating ticket:', error.message || error);
      throw error;
    }
  };

  // Функция загрузки сообщений клиента
  const getClientMessages = async () => {
    try {
      const token = Cookies.get('jwt');
      if (!token) {
        console.warn('Нет токена. Пропускаем загрузку сообщений.');
        return;
      }

      const response = await fetch('https://pandatur-api.com/messages', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Origin: 'https://plutonium8t8.github.io'
        },
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // console.log("Сообщения, загруженные из API:", data);

      setMessages(data); // Обновляем состояние всех сообщений
      updateUnreadMessages(data); // Считаем непрочитанные сообщения
    } catch (error) {
      enqueueSnackbar('Не удалось получить сообщения!', { variant: 'error' });
      console.error('Ошибка при получении сообщений:', error.message);
    }
  };

  // Функция для получения сообщений для конкретного client_id
  const getClientMessagesSingle = async (client_id) => {
    try {
      const token = Cookies.get('jwt');
      if (!token) {
        console.warn('Нет токена. Пропускаем загрузку сообщений.');
        return;
      }
      console.log("client_id din zapros", client_id);

      const response = await fetch(`https://pandatur-api.com/messages/client/${client_id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Origin: 'https://plutonium8t8.github.io',
        },
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Сообщения для клиента ${client_id}, загруженные из API:`, data);

      if (Array.isArray(data) && data.length > 0) {
        setMessages((prevMessages) => {
          const otherMessages = prevMessages.filter((msg) => msg.client_id !== client_id);
          const updatedMessages = [...otherMessages, ...data];

          // Обновляем счетчик непрочитанных сообщений после обновления состояния
          setTimeout(() => updateUnreadMessages(updatedMessages), 0);

          return updatedMessages;
        });
      }
    } catch (error) {
      enqueueSnackbar('Не удалось получить сообщения!', { variant: 'error' });
      console.error('Ошибка при получении сообщений:', error.message);
    }
  };

  // Обработка сообщений через WebSocket
  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'message': {
        console.log("Новое сообщение из WebSocket:", message.data);

        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, message.data];

          // Проверяем, если сообщение от оператора
          if (message.data.sender_id === 1) {
            // console.log("Сообщение от оператора через WebSocket:", message.data);
          } else {
            // Если сообщение от клиента, обновляем непрочитанные
            updateUnreadMessages(updatedMessages);
          }

          return updatedMessages;
        });

        // Проверяем, связан ли тикет с текущим пользователем
        const ticket = ticketsRef.current.find(
          (t) => t.client_id === message.data.client_id
        );

        if (ticket && ticket.technician_id === userId) {
          const messageText = truncateText(message.data.message, 40);

          enqueueSnackbar(
            '', // Текст можно оставить пустым, так как используется кастомное отображение
            {
              variant: 'info',
              action: (snackbarId) => (
                <div className="snack-bar-notification">
                  <div
                    className="snack-object"
                    onClick={() => closeSnackbar(snackbarId)}
                  >
                    <div className="snack-icon">
                      <FaEnvelope />
                    </div>
                    <div className="snack-message">
                      <strong>Клиент {message.data.client_id}</strong>: {messageText}
                    </div>
                  </div>
                  <div className="snack-close">
                    <button onClick={() => closeSnackbar(snackbarId)}>
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ),
            }
          );
        }
        break;
      }
      case 'seen': {
        const { ticket_id, seen_at, client_id } = message.data;

        console.log('🔄 Получен `seen` из WebSocket:', { ticket_id, seen_at, client_id });

        // Обновляем `messages`
        setMessages((prevMessages) => {
          const updatedMessages = prevMessages.map((msg) => {
            if (msg.client_id === client_id && msg.ticket_id === ticket_id) {
              return { ...msg, seen_at, seen_by: JSON.stringify({ [userId]: true }) };
            }
            return msg;
          });

          return [...updatedMessages]; // Создаем новый массив для ререндера
        });

        // Обновляем `unreadMessages` через `setTimeout`, чтобы дождаться обновления `messages`
        setTimeout(() => {
          setUnreadMessages((prevUnreadMessages) => {
            const updatedUnreadMap = new Map(prevUnreadMessages);

            updatedUnreadMap.forEach((msg, msgId) => {
              if (msg.client_id === client_id && msg.ticket_id === ticket_id) {
                updatedUnreadMap.delete(msgId);
              }
            });

            console.log("✅ Обновленные `unreadMessages` после `seen`:", updatedUnreadMap.size);
            return updatedUnreadMap;
          });
        }, 100);

        break;
      }
      case 'ticket': {
        console.log("Пришел тикет:", message.data);

        // Извлекаем client_id из сообщения
        const ticketId = message.data.ticket_id;
        const clientId = message.data.client_id;

        if (!ticketId) {
          console.warn("Не удалось извлечь ticket_id из сообщения типа 'ticket'.");
          break;
        }

        // Запрашиваем тикет по ticket_id
        fetchSingleTicket(ticketId);

        const socketInstance = socketRef.current; // Используем socketRef.current
        if (socketInstance && socketInstance.readyState === WebSocket.OPEN) {
          const socketMessage = JSON.stringify({
            type: 'connect',
            data: { ticket_id: [ticketId] }, // Подключаемся только к комнате с этим client_id
          });

          socketInstance.send(socketMessage);
          // console.log(
          //   `Подключено к комнате клиента с client_id=${clientId}. Отправлено сообщение:`,
          //   socketMessage
          // );
        } else {
          console.warn("Не удалось подключиться к комнатам. WebSocket не готов.");
          console.log(
            "Состояние WebSocket:",
            socketInstance ? socketInstance.readyState : "Нет WebSocket соединения"
          );
        }
        break;
      }
      case 'notification': {
        const notificationText = truncateText(
          message.data.description || 'Уведомление с пустым текстом!',
          100
        );
        enqueueSnackbar(notificationText, { variant: 'info' });
        break;
      }
      case 'task': {
        enqueueSnackbar(`Новое задание: ${message.data.title}`, { variant: 'warning' });
        break;
      }
      case 'pong':
        console.log("пришел понг");
        break;
      default:
        console.warn('Неизвестный тип сообщения:', message.type);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      getClientMessages();
    }
  }, [isLoggedIn]);

  return (
    <AppContext.Provider
      value={{
        tickets,
        setTickets,
        ticketIds,
        messages,
        setMessages,
        unreadCount,
        markMessagesAsRead,
        clientMessages,
        isLoading,
        updateTicket,
        fetchTickets,
        socketRef,
        // unreadCount: unreadMessages.size, // Количество непрочитанных сообщений
      }}
    >
      {children}
    </AppContext.Provider>
  );
};