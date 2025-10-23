import {
  TextInput,
  Title,
  Box,
  ActionIcon,
  Flex,
  Button,
  Group,
  Stack,
  Text,
  Divider,
  Avatar,
  Loader,
  Tooltip,
  Select,
  Collapse,
} from "@mantine/core";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "@mantine/form";
import { getLanguageByKey } from "../../utils";
import { LuPlus, LuUser, LuMail, LuPhone, LuChevronDown, LuChevronUp } from "react-icons/lu";
import { MdEdit, MdClose, MdCheck } from "react-icons/md";
import { FaFacebook, FaInstagram, FaWhatsapp, FaViber, FaTelegram } from "react-icons/fa";
import { api } from "../../../api";
import { useSnackbar } from "notistack";
import "./PersonalData4ClientForm.css";

const getContactTypeLabels = () => ({
  facebook: "Facebook",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  viber: "Viber",
  telegram: "Telegram",
  phone: getLanguageByKey("Telefon"),
  email: getLanguageByKey("Email"),
});

const CONTACT_TYPE_COLORS = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  whatsapp: "#25D366",
  viber: "#7360F2",
  telegram: "#0088CC",
};

const PLATFORM_ICONS = {
  facebook: FaFacebook,
  instagram: FaInstagram,
  whatsapp: FaWhatsapp,
  viber: FaViber,
  telegram: FaTelegram,
};

export const PersonalData4ClientForm = ({ ticketId }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedClientId, setExpandedClientId] = useState(null);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [editingContact, setEditingContact] = useState(null); // { clientId, contactId, type }

  const form = useForm({
    initialValues: {
      name: "",
      surname: "",
      phone: "",
      email: "",
    },
    validate: {
      email: (value) => {
        if (!value) return null;
        return /^\S+@\S+$/.test(value) ? null : getLanguageByKey("Email invalid");
      },
    },
  });

  const contactForm = useForm({
    initialValues: {
      contact_type: "",
      contact_value: "",
      is_primary: false,
    },
    validate: {
      contact_type: (value) => (!value ? getLanguageByKey("Selectați tipul de contact") : null),
      contact_value: (value, values) => {
        if (!value) return getLanguageByKey("Introduceți valoarea contactului");
        
        if (values.contact_type === "email") {
          return /^\S+@\S+$/.test(value) ? null : getLanguageByKey("Email invalid");
        }
        
        if (values.contact_type === "phone") {
          return /^\d+$/.test(value) ? null : getLanguageByKey("Introduceți doar cifre");
        }
        
        return null;
      },
    },
  });

  const editContactForm = useForm({
    initialValues: {
      contact_value: "",
    },
    validate: {
      contact_value: (value) => {
        if (!value) return getLanguageByKey("Introduceți valoarea contactului");
        
        if (editingContact?.type === "email") {
          return /^\S+@\S+$/.test(value) ? null : getLanguageByKey("Email invalid");
        }
        
        if (editingContact?.type === "phone") {
          return /^\d+$/.test(value) ? null : getLanguageByKey("Introduceți doar cifre");
        }
        
        return null;
      },
    },
  });

  // Загрузка данных клиентов
  const loadClientsData = useCallback(async () => {
    if (!ticketId) return;
    
    try {
      setLoading(true);
      // Передаем undefined или null для platform, чтобы получить всех клиентов
      const response = await api.users.getUsersClientContactsByPlatform(ticketId, undefined);
      
      if (response?.clients) {
        setClients(response.clients);
      }
    } catch (error) {
      console.error("Ошибка загрузки данных клиентов:", error);
      enqueueSnackbar(getLanguageByKey("Eroare la încărcarea datelor clienților"), {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [ticketId, enqueueSnackbar]);

  useEffect(() => {
    loadClientsData();
  }, [loadClientsData]);

  // Слушаем событие обновления тикета
  useEffect(() => {
    const handleTicketUpdate = (event) => {
      if (event.detail?.ticketId === ticketId) {
        loadClientsData();
      }
    };

    window.addEventListener('ticketUpdated', handleTicketUpdate);
    
    return () => {
      window.removeEventListener('ticketUpdated', handleTicketUpdate);
    };
  }, [ticketId, loadClientsData]);

  // Обработчик добавления нового клиента
  const handleAddClient = () => {
    form.reset();
    setShowAddForm(true);
  };

  // Сохранение нового клиента
  const handleSaveClient = async () => {
    // Валидация формы
    if (form.validate().hasErrors) {
      return;
    }

    const values = form.values;

    // Валидация - требуется хотя бы одно поле
    if (!values.name && !values.surname && !values.phone && !values.email) {
      enqueueSnackbar(getLanguageByKey("Completați cel puțin un câmp"), {
        variant: "warning",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      await api.tickets.ticket.addClientToTicket({
        ticket_id: ticketId,
        name: values.name || null,
        surname: values.surname || null,
        phone: values.phone || null,
        email: values.email || null,
      });

      enqueueSnackbar(getLanguageByKey("Clientul a fost adăugat cu succes"), {
        variant: "success",
      });

      setShowAddForm(false);
      form.reset();
      
      // Перезагружаем данные клиентов
      await loadClientsData();

      // Диспатчим событие для обновления данных тикета
      window.dispatchEvent(new CustomEvent('ticketUpdated', {
        detail: { ticketId }
      }));
    } catch (error) {
      console.error("Ошибка добавления клиента:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    form.reset();
  };

  const handlePhoneChange = (e) => {
    const onlyDigits = e.currentTarget.value.replace(/\D/g, "");
    form.setFieldValue("phone", onlyDigits);
  };

  const handleContactPhoneChange = (e) => {
    const onlyDigits = e.currentTarget.value.replace(/\D/g, "");
    contactForm.setFieldValue("contact_value", onlyDigits);
  };

  // Обработчик добавления контакта к клиенту
  const handleAddContact = async (clientId) => {
    if (contactForm.validate().hasErrors) {
      return;
    }

    try {
      setIsSavingContact(true);

      await api.users.addClientContact(clientId, {
        contact_type: contactForm.values.contact_type,
        contact_value: contactForm.values.contact_value,
        is_primary: contactForm.values.is_primary,
      });

      enqueueSnackbar(getLanguageByKey("Contactul a fost adăugat cu succes"), {
        variant: "success",
      });

      contactForm.reset();
      setExpandedClientId(null);

      // Перезагружаем данные клиентов
      await loadClientsData();

      // Диспатчим событие для обновления данных тикета
      window.dispatchEvent(new CustomEvent('ticketUpdated', {
        detail: { ticketId }
      }));
    } catch (error) {
      console.error("Ошибка добавления контакта:", error);
    } finally {
      setIsSavingContact(false);
    }
  };

  const toggleClientExpand = (clientId) => {
    if (expandedClientId === clientId) {
      setExpandedClientId(null);
      contactForm.reset();
    } else {
      setExpandedClientId(clientId);
      contactForm.reset();
    }
  };

  // Начать редактирование контакта
  const startEditContact = (clientId, contactId, contactType, currentValue) => {
    setEditingContact({ clientId, contactId, type: contactType });
    editContactForm.setValues({ contact_value: currentValue });
  };

  // Отменить редактирование
  const cancelEditContact = () => {
    setEditingContact(null);
    editContactForm.reset();
  };

  // Сохранить изменения контакта
  const handleUpdateContact = async () => {
    if (!editingContact) return;

    const validation = editContactForm.validate();
    if (validation.hasErrors) return;

    try {
      setIsSavingContact(true);

      await api.users.updateClientContact(
        editingContact.clientId,
        editingContact.contactId,
        {
          contact_value: editContactForm.values.contact_value,
        }
      );

      enqueueSnackbar(getLanguageByKey("Contactul a fost actualizat cu succes"), {
        variant: "success",
      });

      cancelEditContact();

      // Перезагружаем данные клиентов
      await loadClientsData();

      // Диспатчим событие для обновления данных тикета
      window.dispatchEvent(new CustomEvent('ticketUpdated', {
        detail: { ticketId }
      }));
    } catch (error) {
      console.error("Ошибка обновления контакта:", error);
      enqueueSnackbar(getLanguageByKey("Eroare la actualizarea contactului"), {
        variant: "error",
      });
    } finally {
      setIsSavingContact(false);
    }
  };

  // Обработка ввода телефона (только цифры) для редактирования
  const handleEditPhoneChange = (event) => {
    const value = event.target.value.replace(/\D/g, '');
    editContactForm.setFieldValue('contact_value', value);
  };

  // Получение всех контактов платформ (не только уникальных типов)
  const getClientPlatformContacts = (contacts) => {
    return contacts.filter((contact) => PLATFORM_ICONS[contact.contact_type]);
  };

  // Получение основного email
  const getPrimaryEmail = (contacts) => {
    const emailContact = contacts.find(
      (c) => c.contact_type === "email" && c.is_primary
    );
    return emailContact?.contact_value || null;
  };

  // Получение основного телефона
  const getPrimaryPhone = (contacts) => {
    const phoneContact = contacts.find(
      (c) => c.contact_type === "phone" && c.is_primary
    );
    return phoneContact?.contact_value || null;
  };

  if (loading) {
    return (
      <Box className="personal-data-container">
        <Flex justify="center" align="center" className="loading-container">
          <Loader size="sm" />
        </Flex>
      </Box>
    );
  }

  return (
    <Box className="personal-data-container">
      <Flex justify="space-between" align="center" mb="md">
        <Title order={3}>{getLanguageByKey("Date personale")}</Title>
        <ActionIcon onClick={handleAddClient} variant="filled">
          <LuPlus size={18} />
        </ActionIcon>
      </Flex>

      {/* Форма добавления нового клиента */}
      {showAddForm && (
        <Box className="add-client-form">
          <Flex justify="space-between" align="center" mb="md">
            <Title order={5} className="add-client-form-title">
              {getLanguageByKey("Adaugă client nou")}
            </Title>
          </Flex>
          
          <TextInput
            label={getLanguageByKey("Nume")}
            placeholder={getLanguageByKey("Introduceti numele")}
            leftSection={<LuUser size={16} />}
            {...form.getInputProps("name")}
            mb="sm"
          />

          <TextInput
            label={getLanguageByKey("Prenume")}
            placeholder={getLanguageByKey("Introduceti prenumele")}
            leftSection={<LuUser size={16} />}
            {...form.getInputProps("surname")}
            mb="sm"
          />

          <TextInput
            label={getLanguageByKey("Email")}
            placeholder="example@email.com"
            type="email"
            leftSection={<LuMail size={16} />}
            {...form.getInputProps("email")}
            mb="sm"
          />

          <TextInput
            label={getLanguageByKey("Telefon")}
            placeholder="37368939111"
            leftSection={<LuPhone size={16} />}
            value={form.values.phone}
            onChange={handlePhoneChange}
            inputMode="numeric"
            mb="md"
          />

          <Group grow>
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSaving}
            >
              {getLanguageByKey("Anulează")}
            </Button>
            <Button 
              onClick={handleSaveClient}
              loading={isSaving}
            >
              {getLanguageByKey("Adaugǎ clientul")}
            </Button>
          </Group>
        </Box>
      )}

      {/* Список клиентов */}
      {clients.length === 0 ? (
        <Text className="empty-state">
          {getLanguageByKey("Nu există clienți asociați cu acest ticket")}
        </Text>
      ) : (
        <Stack gap="md">
          {clients.map((client) => {
            const fullName = [client.name, client.surname].filter(Boolean).join(" ") || "—";
            const platformContacts = getClientPlatformContacts(client.contacts);
            const primaryEmail = getPrimaryEmail(client.contacts);
            const primaryPhone = getPrimaryPhone(client.contacts);

            const isExpanded = expandedClientId === client.id;

            return (
              <Box key={client.id} className="client-card">
                {/* Шапка карточки с аватаром и именем */}
                <Flex align="center" gap="md" mb="md">
                  <Avatar 
                    src={client.photo} 
                    radius="xl" 
                    size="lg"
                  >
                    <LuUser size={24} />
                  </Avatar>
                  <Box style={{ flex: 1 }}>
                    <Text className="client-card-name">{fullName}</Text>
                    <Text className="client-card-subtitle">
                      {getLanguageByKey("ID")}: {client.id}
                    </Text>
                  </Box>
                  <ActionIcon 
                    onClick={() => toggleClientExpand(client.id)}
                    variant="subtle"
                    size="lg"
                  >
                    {isExpanded ? <LuChevronUp size={20} /> : <LuChevronDown size={20} />}
                  </ActionIcon>
                </Flex>

                {/* Email */}
                {primaryEmail && (
                  <>
                    {editingContact?.clientId === client.id && editingContact?.type === "email" ? (
                      <Box mb="xs">
                        <TextInput
                          leftSection={<LuMail size={16} />}
                          placeholder="example@email.com"
                          type="email"
                          {...editContactForm.getInputProps("contact_value")}
                          rightSection={
                            <Flex gap="xs" align="center" wrap="nowrap">
                              <ActionIcon 
                                size="sm" 
                                variant="subtle" 
                                color="red"
                                onClick={cancelEditContact}
                                disabled={isSavingContact}
                              >
                                <MdClose size={16} />
                              </ActionIcon>
                              <ActionIcon 
                                size="sm" 
                                variant="subtle" 
                                color="green"
                                onClick={handleUpdateContact}
                                loading={isSavingContact}
                              >
                                <MdCheck size={16} />
                              </ActionIcon>
                            </Flex>
                          }
                        />
                      </Box>
                    ) : (
                      <Flex align="center" gap="sm" mb="xs" className="client-card-contact">
                        <LuMail size={16} className="client-card-icon" />
                        <Text className="client-card-contact-text" style={{ flex: 1 }}>{primaryEmail}</Text>
                        <ActionIcon 
                          size="sm" 
                          variant="subtle"
                          onClick={() => {
                            const emailContact = client.contacts.find(
                              (c) => c.contact_type === "email" && c.is_primary
                            );
                            if (emailContact) {
                              startEditContact(client.id, emailContact.id, "email", emailContact.contact_value);
                            }
                          }}
                        >
                          <MdEdit size={14} />
                        </ActionIcon>
                      </Flex>
                    )}
                  </>
                )}

                {/* Телефон */}
                {primaryPhone && (
                  <>
                    {editingContact?.clientId === client.id && editingContact?.type === "phone" ? (
                      <Box mb="md">
                        <TextInput
                          leftSection={<LuPhone size={16} />}
                          placeholder="37368939111"
                          type="text"
                          inputMode="numeric"
                          {...editContactForm.getInputProps("contact_value")}
                          onChange={handleEditPhoneChange}
                          value={editContactForm.values.contact_value}
                          rightSection={
                            <Flex gap="xs" align="center" wrap="nowrap">
                              <ActionIcon 
                                size="sm" 
                                variant="subtle" 
                                color="red"
                                onClick={cancelEditContact}
                                disabled={isSavingContact}
                              >
                                <MdClose size={16} />
                              </ActionIcon>
                              <ActionIcon 
                                size="sm" 
                                variant="subtle" 
                                color="green"
                                onClick={handleUpdateContact}
                                loading={isSavingContact}
                              >
                                <MdCheck size={16} />
                              </ActionIcon>
                            </Flex>
                          }
                        />
                      </Box>
                    ) : (
                      <Flex align="center" gap="sm" mb="md" className="client-card-contact">
                        <LuPhone size={16} className="client-card-icon" />
                        <Text className="client-card-contact-text" style={{ flex: 1 }}>{primaryPhone}</Text>
                        <ActionIcon 
                          size="sm" 
                          variant="subtle"
                          onClick={() => {
                            const phoneContact = client.contacts.find(
                              (c) => c.contact_type === "phone" && c.is_primary
                            );
                            if (phoneContact) {
                              startEditContact(client.id, phoneContact.id, "phone", phoneContact.contact_value);
                            }
                          }}
                        >
                          <MdEdit size={14} />
                        </ActionIcon>
                      </Flex>
                    )}
                  </>
                )}

                {/* Платформы */}
                {platformContacts.length > 0 && (
                  <>
                    <Divider className="section-divider" mb="sm" />
                    <Flex gap="sm" wrap="wrap">
                      {platformContacts.map((contact, index) => {
                        const Icon = PLATFORM_ICONS[contact.contact_type];
                        const labels = getContactTypeLabels();
                        return (
                          <Tooltip 
                            key={`${contact.contact_type}-${contact.id}-${index}`} 
                            label={`${labels[contact.contact_type]}: ${contact.contact_value}`}
                            position="top"
                          >
                            <Box className="platform-icon-container">
                              <Icon 
                                size={20} 
                                style={{ color: CONTACT_TYPE_COLORS[contact.contact_type] }}
                              />
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Flex>
                  </>
                )}

                {/* Форма добавления контакта */}
                <Collapse in={isExpanded}>
                  <Divider className="section-divider" my="md" />
                  <Box className="add-contact-form">
                    <Title order={6} mb="xs">
                      {getLanguageByKey("Adaugă contact nou")}
                    </Title>
                    
                    <Text size="xs" c="dimmed" mb="md">
                      {getLanguageByKey("Platformele sociale se adaugă automat prin mesaje")}
                    </Text>

                    <Select
                      label={getLanguageByKey("Tip contact")}
                      placeholder={getLanguageByKey("Selectați tipul")}
                      data={[
                        { value: "phone", label: getLanguageByKey("Telefon") },
                        { value: "email", label: "Email" },
                      ]}
                      {...contactForm.getInputProps("contact_type")}
                      mb="sm"
                    />

                    <TextInput
                      label={getLanguageByKey("Valoare contact")}
                      placeholder={
                        contactForm.values.contact_type === "email"
                          ? "example@email.com"
                          : contactForm.values.contact_type === "phone"
                          ? "37368939111"
                          : getLanguageByKey("Introduceți valoarea")
                      }
                      leftSection={
                        contactForm.values.contact_type === "email" ? (
                          <LuMail size={16} />
                        ) : contactForm.values.contact_type === "phone" ? (
                          <LuPhone size={16} />
                        ) : null
                      }
                      type={contactForm.values.contact_type === "email" ? "email" : "text"}
                      inputMode={contactForm.values.contact_type === "phone" ? "numeric" : "text"}
                      {...contactForm.getInputProps("contact_value")}
                      onChange={
                        contactForm.values.contact_type === "phone"
                          ? handleContactPhoneChange
                          : contactForm.getInputProps("contact_value").onChange
                      }
                      value={contactForm.values.contact_value}
                      mb="md"
                    />

                    <Group grow>
                      <Button 
                        variant="outline" 
                        onClick={() => toggleClientExpand(client.id)}
                        disabled={isSavingContact}
                      >
                        {getLanguageByKey("Anulează")}
                      </Button>
                      <Button 
                        onClick={() => handleAddContact(client.id)}
                        loading={isSavingContact}
                      >
                        {getLanguageByKey("Adaugă contact")}
                      </Button>
                    </Group>
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};
