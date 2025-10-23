import { useState, useEffect, useMemo, useCallback, useRef, startTransition } from "react";
import { useSnackbar } from "notistack";
import { api } from "../api";
import { showServerError } from "@utils";
import { getPagesByType } from "../constants/webhookPagesConfig";

/** ====================== helpers ====================== */

/** безопасный лог (вырубаем в проде одной переменной) */
const DEBUG = true; // Временно включено для отладки
const debug = (...args) => { if (DEBUG) console.log("[useClientContacts]", ...args); };

/** приводим платформенные данные к объекту { [contactId]: contactData } */
function normalizePlatformBlock(block) {
  if (!block) return {};
  if (Array.isArray(block)) {
    // если вдруг пришёл массив — преобразуем к объекту по index.id
    return block.reduce((acc, item, idx) => {
      const id = item?.id ?? idx;
      acc[id] = item || {};
      return acc;
    }, {});
  }
  if (typeof block === "object") return block;
  return {};
}

/** строим быстрый индекс contactId -> client для ticketData.clients */
function buildClientIndex(clients) {
  const map = new Map(); // key: contactId(number) -> client
  (clients || []).forEach((c) => {
    (c.contacts || []).forEach((ct) => {
      if (ct?.id != null) map.set(Number.parseInt(ct.id, 10), c);
    });
  });
  return map;
}

/** из ticketData строим список платформ с контактами */
function computePlatformOptions(ticketData) {
  if (!ticketData) return [];

  const options = [];
  Object.keys(ticketData).forEach((key) => {
    if (key === "clients") return;
    const block = normalizePlatformBlock(ticketData[key]);
    const hasAny = Object.keys(block).length > 0;
    if (hasAny) {
      options.push({
        label: key,
        value: key,
        payload: { platform: key },
      });
    }
  });

  // стабильный порядок (не обяз., но чтобы селект не «плясал»)
  options.sort((a, b) => a.label.localeCompare(b.label));
  return options;
}

/** формируем опции контактов для выбранной платформы */
function computeContactOptions(ticketData, selectedPlatform) {
  if (!ticketData || !selectedPlatform) return [];
  const block = normalizePlatformBlock(ticketData[selectedPlatform]);
  const clientIndex = buildClientIndex(ticketData.clients);

  const contacts = Object.entries(block).map(([contactIdRaw, contactData]) => {
    const contactId = Number.parseInt(contactIdRaw, 10);
    const client = clientIndex.get(contactId);

    const client_id = client?.id;
    const name = contactData?.name || client?.name || "";
    const surname = contactData?.surname || client?.surname || "";
    const contact_value = contactData?.contact_value || "";

    // лейблы — единая логика
    let label;
    if (["whatsapp", "viber", "telegram"].includes(selectedPlatform)) {
      const fullName = `${name} ${surname || ""}`.trim();
      label = `${fullName} - ${contact_value}`;
    } else {
      label = `${contactId} - ${name} ${surname || ""}`.trim();
    }

    return {
      label,
      value: `${client_id ?? "x"}-${contactId}`,
      payload: {
        id: client_id,
        client_id,
        contact_id: contactId,
        platform: selectedPlatform,
        name,
        surname,
        phone: selectedPlatform === "phone" ? contact_value : "",
        email: selectedPlatform === "email" ? contact_value : "",
        contact_value,
        is_primary: Boolean(contactData?.is_primary),
        photo: client?.photo,
      },
    };
  });

  // опционально: сортировка по имени, чтобы было стабильно
  contacts.sort((a, b) => a.label.localeCompare(b.label));
  return contacts;
}

/** попытка найти контакт в списке по (contact_value, client_id), потом по contact_value */
function matchContact(contactOptions, contactValue, clientId) {
  if (!contactOptions?.length || !contactValue) return null;
  const full = contactOptions.find(
    (c) => c?.payload?.contact_value === contactValue && c?.payload?.client_id === clientId
  );
  if (full) return full;
  return contactOptions.find((c) => c?.payload?.contact_value === contactValue) || null;
}

/** фильтранём page_id по groupTitle */
function selectPageIdByMessage(platform, messagePageId, groupTitle) {
  if (!platform) return null;
  const allPages = getPagesByType(platform) || [];
  const filtered = groupTitle ? allPages.filter((p) => p.group_title === groupTitle) : allPages;
  if (!filtered.length) return null;
  return filtered.some((p) => p.page_id === messagePageId)
    ? messagePageId
    : filtered[0].page_id;
}

/** ====================== хук ====================== */

export const useClientContacts = (ticketId, lastMessage, groupTitle) => {
  const { enqueueSnackbar } = useSnackbar();

  // минимально необходимый стейт
  const [ticketData, setTicketData] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedClient, setSelectedClient] = useState({}); // option целиком
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [loading, setLoading] = useState(false);

  // защищаемся от гонок запросов
  const abortRef = useRef(null);
  const ticketIdRef = useRef(ticketId);
  ticketIdRef.current = ticketId;

  /** загрузка ticketData (контактов по платформам) */
  const fetchClientContacts = useCallback(async () => {
    if (!ticketId) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const response = await api.users.getUsersClientContactsByPlatform(ticketId, null, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return; // уже не актуально

      startTransition(() => {
        setTicketData(response);
        // сбросим выборы — и дадим авто-логике выставить их ниже
        setSelectedPlatform(null);
        setSelectedClient({});
        setSelectedPageId(null);
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        enqueueSnackbar(showServerError(error), { variant: "error" });
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]); // Убираем enqueueSnackbar из зависимостей - намеренно, чтобы избежать бесконечного цикла

  // мемо-вычисления вместо лишних setState
  const platformOptions = useMemo(
    () => computePlatformOptions(ticketData),
    [ticketData]
  );

  const contactOptions = useMemo(
    () => computeContactOptions(ticketData, selectedPlatform),
    [ticketData, selectedPlatform]
  );

  /** авто-подгрузка при изменении ticketId */
  useEffect(() => {
    if (!ticketId) return;
    
    debug("ticketId changed → refetch + local reset", ticketId);
    // Мягкий сброс локально — визуально не «мигать»
    startTransition(() => {
      setSelectedPlatform(null);
      setSelectedClient({});
      setSelectedPageId(null);
    });
    
    // Вызываем fetchClientContacts напрямую, не через зависимость
    fetchClientContacts();
    
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]); // Убираем fetchClientContacts из зависимостей - намеренно, чтобы избежать бесконечного цикла

  /** шаг 1: выбрать платформу на основе lastMessage или взять первую доступную */
  useEffect(() => {
    if (!ticketData || !platformOptions.length) return;

    // если уже выбрана — пропускаем
    if (selectedPlatform) return;

    debug("step 1: START", {
      hasLastMessage: !!lastMessage,
      lastMessageTicketId: lastMessage?.ticket_id,
      currentTicketId: ticketId,
      lastMessagePlatform: lastMessage?.platform,
      availablePlatforms: platformOptions.map(p => p.value)
    });

    let nextPlatform = null;

    if (lastMessage && lastMessage.ticket_id === ticketId) {
      const msgPlatform = lastMessage.platform?.toLowerCase();
      debug("step 1: checking lastMessage for platform", {
        msgPlatform,
        availablePlatforms: platformOptions.map(p => p.value),
        lastMessageId: lastMessage.id,
        lastMessageTime: lastMessage.time_sent || lastMessage.created_at,
        from_reference: lastMessage.from_reference,
        to_reference: lastMessage.to_reference,
        client_id: lastMessage.client_id,
        sender_id: lastMessage.sender_id
      });
      
      if (msgPlatform && platformOptions.some((p) => p.value === msgPlatform)) {
        nextPlatform = msgPlatform;
        debug("step 1: platform found in lastMessage:", nextPlatform);
      } else {
        debug("step 1: platform from lastMessage not valid", {
          msgPlatform,
          platformInOptions: platformOptions.some((p) => p.value === msgPlatform)
        });
      }
    } else {
      debug("step 1: lastMessage not valid", {
        hasLastMessage: !!lastMessage,
        ticketIdMatch: lastMessage?.ticket_id === ticketId
      });
    }

    if (!nextPlatform) {
      // дефолт — первая платформа
      nextPlatform = platformOptions[0]?.value || null;
      debug("step 1: no platform from lastMessage, using first available:", nextPlatform);
    }

    if (nextPlatform && nextPlatform !== selectedPlatform) {
      debug("step 1: auto select platform:", nextPlatform);
      setSelectedPlatform(nextPlatform);
    }
  }, [ticketData, platformOptions, lastMessage, ticketId, selectedPlatform]);

  /** шаг 2: выбрать page_id (по платформе и groupTitle) */
  useEffect(() => {
    if (!selectedPlatform) return;

    // если уже выбран — пропускаем
    if (selectedPageId) return;

    let nextPageId = null;

    if (lastMessage && lastMessage.ticket_id === ticketId) {
      debug("step 2: checking lastMessage for page_id", {
        lastMessagePageId: lastMessage.page_id,
        platform: selectedPlatform,
        groupTitle
      });
      
      const candidate = selectPageIdByMessage(
        selectedPlatform,
        lastMessage.page_id,
        groupTitle
      );
      if (candidate) {
        nextPageId = candidate;
        debug("step 2: found page_id from lastMessage:", candidate);
      }
    }

    // если не нашли через lastMessage — выберем первую релевантную страницу
    if (!nextPageId) {
      const all = getPagesByType(selectedPlatform) || [];
      const filtered = groupTitle ? all.filter((p) => p.group_title === groupTitle) : all;
      nextPageId = filtered[0]?.page_id || null;
      debug("step 2: using first available page_id:", nextPageId, "from", filtered.length, "filtered pages");
    }

    if (nextPageId && nextPageId !== selectedPageId) {
      debug("step 2: auto select page_id:", nextPageId);
      setSelectedPageId(nextPageId);
    }
  }, [selectedPlatform, lastMessage, ticketId, groupTitle, selectedPageId]);

  /** шаг 3: выбрать контакт (когда уже известны платформа и contactOptions) */
  useEffect(() => {
    if (!selectedPlatform || !contactOptions.length) return;

    // уже выбран — выходим
    if (selectedClient?.value) return;

    let contactValue = null;
    let messageClientId = null;

    if (lastMessage && lastMessage.ticket_id === ticketId) {
      messageClientId = lastMessage.client_id;
      
      // Определяем контакт клиента в зависимости от направления сообщения
      if (lastMessage.sender_id === lastMessage.client_id) {
        // Входящее сообщение от клиента: берем from_reference
        contactValue = lastMessage.from_reference;
      } else {
        // Исходящее сообщение к клиенту: берем to_reference
        contactValue = lastMessage.to_reference;
      }

      debug("step 3: contact selection from lastMessage", {
        messageClientId,
        contactValue,
        isIncoming: lastMessage.sender_id === lastMessage.client_id,
        from_ref: lastMessage.from_reference,
        to_ref: lastMessage.to_reference
      });

      // если в сообщении ссылка пустая — попробуем найти по client_id
      if (!contactValue && ticketData?.[selectedPlatform]) {
        const block = normalizePlatformBlock(ticketData[selectedPlatform]);
        const clientIndex = buildClientIndex(ticketData.clients);
        const entry = Object.entries(block).find(([cid]) => {
          const client = clientIndex.get(Number.parseInt(cid, 10));
          return client?.id === messageClientId;
        });
        if (entry) {
          contactValue = entry[1]?.contact_value;
          debug("step 3: found contactValue by client_id", contactValue);
        }
      }
    }

    const found = matchContact(contactOptions, contactValue, messageClientId);
    if (found) {
      debug("auto select contact:", found.value, found.label);
      setSelectedClient(found);
    } else if (contactOptions.length) {
      // мягкий дефолт — первый контакт
      debug("auto select first contact as fallback:", contactOptions[0].value);
      setSelectedClient(contactOptions[0]);
    }
  }, [selectedPlatform, contactOptions, selectedClient?.value, lastMessage, ticketId, ticketData]);

  /** публичные коллбеки (стабильные ссылки) */
  const changePlatform = useCallback((platform) => {
    startTransition(() => {
      setSelectedPlatform(platform || null);
      setSelectedClient({});
      setSelectedPageId(null); // сбрасываем page_id, чтобы авто-эффект выбрал правильный для новой платформы
    });
  }, []);

  const changeContact = useCallback((value) => {
    const contact = contactOptions.find((o) => o.value === value);
    if (contact) setSelectedClient(contact);
  }, [contactOptions]);

  const changePageId = useCallback((pageId) => {
    setSelectedPageId(pageId || null);
  }, []);

  /** точечное обновление ФИО/почты/телефона клиента */
  const updateClientData = useCallback((clientId, platform, newData) => {
    setTicketData((prev) => {
      if (!prev?.clients) return prev;
      const next = {
        ...prev,
        clients: prev.clients.map((c) =>
          c.id === clientId
            ? {
              ...c,
              name: newData.name ?? c.name,
              surname: newData.surname ?? c.surname,
              phone: newData.phone ?? c.phone,
              email: newData.email ?? c.email,
            }
            : c
        ),
      };
      return next;
    });

    // обновим выбранный контакт, если это он
    setSelectedClient((prev) =>
      prev?.payload?.id === clientId
        ? { ...prev, payload: { ...prev.payload, ...newData } }
        : prev
    );
  }, []);

  /** ====================== api ====================== */
  return {
    platformOptions,            // memo
    selectedPlatform,
    changePlatform,

    contactOptions,             // memo
    changeContact,
    selectedClient,

    selectedPageId,
    changePageId,

    loading,
    updateClientData,
    refetch: fetchClientContacts,
  };
};
