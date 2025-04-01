import React, { useState, useEffect, useRef } from "react"
import { Select, Box } from "@mantine/core"
import { useApp, useUser } from "../../hooks"
import { api } from "../../api"
import TaskListOverlay from "../Task/Components/TicketTask/TaskListOverlay"
import {
  FaFacebook,
  FaViber,
  FaInstagram,
  FaWhatsapp,
  FaTelegram
} from "react-icons/fa"
import { translations } from "../utils/translations"
import { Spin } from "../Spin"
import { ChatInput } from "./components"

const ChatMessages = ({
  selectTicketId,
  setSelectedClient,
  selectedClient,
  isLoading,
  personalInfo,
  setPersonalInfo
}) => {
  const { userId } = useUser()
  const { messages, setMessages, tickets } = useApp()

  const language = localStorage.getItem("language") || "RO"
  const [managerMessage, setManagerMessage] = useState("")

  const [selectedMessageId, setSelectedMessageId] = useState(null)
  const [selectedReaction, setSelectedReaction] = useState({})
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const messageContainerRef = useRef(null)
  const reactionContainerRef = useRef(null)
  const [isUserAtBottom, setIsUserAtBottom] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState("web")
  const [tasks, setTasks] = useState([])
  const [listTask, setListTask] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)

  const platformIcons = {
    facebook: <FaFacebook />,
    instagram: <FaInstagram />,
    whatsapp: <FaWhatsapp />,
    viber: <FaViber />,
    telegram: <FaTelegram />
  }

  const getLastClientWhoSentMessage = () => {
    if (!Array.isArray(messages) || messages.length === 0) return null

    const ticketMessages = messages
      .filter(
        (msg) => msg.ticket_id === selectTicketId && Number(msg.sender_id) !== 1
      )
      .sort((a, b) => parseDate(b.time_sent) - parseDate(a.time_sent))

    return ticketMessages.length > 0 ? ticketMessages[0].client_id : null
  }

  useEffect(() => {
    const lastClient = getLastClientWhoSentMessage()
    if (lastClient) {
      console.log(
        `🔍 Последний клиент, который отправил сообщение: ${lastClient}`
      )
      setSelectedClient(String(lastClient))
    }
  }, [messages, selectTicketId])

  const parseDate = (dateString) => {
    if (!dateString) return null
    const [date, time] = dateString.split(" ")
    if (!date || !time) return null
    const [day, month, year] = date.split("-")
    return new Date(`${year}-${month}-${day}T${time}`)
  }

  const handleReactionClick = (reaction, messageId) => {
    setSelectedReaction((prev) => ({ ...prev, [messageId]: reaction }))
  }

  const uploadFile = async (file) => {
    const formData = new FormData()
    formData.append("file", file)

    console.log("Подготовка к загрузке файла...")
    console.log("FormData:", formData)

    try {
      const data = await api.messages.upload(formData)

      return data
    } catch (error) {
      console.error("Ошибка загрузки файла:", error)
      throw error
    }
  }

  const sendMessage = async (selectedFile, platform) => {
    if (!managerMessage.trim() && !selectedFile) {
      console.error("Ошибка: Отправка пустого сообщения невозможна.")
      return
    }

    try {
      const messageData = {
        sender_id: Number(userId),
        client_id: selectedClient,
        platform: platform,
        message: managerMessage.trim(),
        media_type: null,
        media_url: ""
      }

      if (selectedFile) {
        console.log("Загрузка файла...")
        const uploadResponse = await uploadFile(selectedFile)

        if (!uploadResponse || !uploadResponse.url) {
          console.error("Ошибка загрузки файла")
          return
        }

        messageData.media_url = uploadResponse.url
        messageData.media_type = getMediaType(selectedFile.type)
      }

      console.log("Отправляемые данные:", JSON.stringify(messageData, null, 2))

      let apiUrl = api.messages.send.create

      if (platform === "telegram") {
        apiUrl = api.messages.send.telegram
      } else if (platform === "viber") {
        apiUrl = api.messages.send.viber
      }

      console.log(`📡 Отправка сообщения через API: ${apiUrl}`)

      setManagerMessage("")

      await apiUrl(messageData)

      console.log(
        `✅ Сообщение успешно отправлено через API ${apiUrl}:`,
        messageData
      )

      setMessages((prevMessages) => [
        ...prevMessages,
        { ...messageData, seenAt: false }
      ])

      if (!selectedFile) setManagerMessage("")
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error)
    }
  }

  const getMediaType = (mimeType) => {
    if (mimeType.startsWith("image/")) return "image"
    if (mimeType.startsWith("video/")) return "video"
    if (mimeType.startsWith("audio/")) return "audio"
    return "file"
  }

  const getLastReaction = (message) => {
    if (!message.reactions || message.reactions === "{}") {
      return "☺"
    }

    try {
      const reactionsObject = JSON.parse(message.reactions)

      const reactionsArray = Object.values(reactionsObject)

      return reactionsArray.length > 0
        ? reactionsArray[reactionsArray.length - 1]
        : "☺"
    } catch (error) {
      console.error("Ошибка при обработке реакций:", error)
      return "☺"
    }
  }

  const handleClick = () => {
    if (!selectedClient) {
      console.error("⚠️ Ошибка: Клиент не выбран!")
      return
    }
    sendMessage(null, selectedPlatform)
  }

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    try {
      await sendMessage(selectedFile, selectedPlatform)
    } catch (error) {
      console.error("Ошибка обработки файла:", error)
    }
  }

  useEffect(() => {
    const newPersonalInfo = {}

    tickets.forEach((ticket) => {
      if (ticket.clients && Array.isArray(ticket.clients)) {
        ticket.clients.forEach((client) => {
          newPersonalInfo[client.id] = client
        })
      }
    })

    setPersonalInfo(newPersonalInfo)
  }, [tickets])

  const handleScroll = () => {
    if (messageContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messageContainerRef.current
      setIsUserAtBottom(scrollHeight - scrollTop <= clientHeight + 50)
    }
  }

  useEffect(() => {
    if (isUserAtBottom && messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight
        // behavior: 'smooth',
      })
    }
  }, [messages, selectTicketId])

  useEffect(() => {
    const container = messageContainerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll)
      }
    }
  }, [])

  const getClientPlatforms = () => {
    const clientId = Number(selectedClient)
    const clientMessages = messages.filter(
      (msg) => Number(msg.client_id) === clientId
    )

    if (!clientMessages || clientMessages.length === 0) {
      return ["web"]
    }

    const uniquePlatforms = [
      ...new Set(clientMessages.map((msg) => msg.platform))
    ]
    return uniquePlatforms.length > 0 ? uniquePlatforms : ["web"]
  }
  useEffect(() => {
    const platforms = getClientPlatforms()
    setSelectedPlatform(platforms[0] || "web")
  }, [selectedClient, messages])

  const getLastMessagePlatform = (clientId) => {
    if (!Array.isArray(messages) || messages.length === 0) return "web"

    const clientMessages = messages
      .filter(
        (msg) =>
          Number(msg.client_id) === Number(clientId) &&
          Number(msg.sender_id) !== 1
      )
      .sort((a, b) => parseDate(b.time_sent) - parseDate(a.time_sent))

    return clientMessages.length > 0 ? clientMessages[0].platform : "web"
  }

  useEffect(() => {
    if (selectedClient) {
      const lastPlatform = getLastMessagePlatform(selectedClient)
      console.log(
        `🔍 Последняя платформа для клиента ${selectedClient}: ${lastPlatform}`
      )
      setSelectedPlatform(lastPlatform || "web")
    }
  }, [selectedClient, messages])

  const fetchTasks = async () => {
    const data = await api.task.getAllTasks()
    setTasks(data)
  }

  const openEditTask = (task) => {
    console.log("Редактирование задачи:", task)
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }

  const usersOptions = () =>
    tickets
      .find((ticket) => ticket.id === selectTicketId)
      ?.client_id.replace(/[{}]/g, "")
      .split(",")
      .map((id) => {
        const clientId = id.trim()
        const clientInfo = personalInfo[clientId] || {}
        const fullName = clientInfo.name
          ? `${clientInfo.name} ${clientInfo.surname || ""}`.trim()
          : `ID: ${clientId}`

        const platformsMessagesClient = messages.filter(
          (msg) => msg.client_id === Number(clientId)
        )

        return [
          ...new Set(platformsMessagesClient.map((msg) => msg.platform))
        ].map((platform) => ({
          value: `${clientId}-${platform}`,
          label: `${fullName} | ${platform.charAt(0).toUpperCase() + platform.slice(1)} | ID: ${clientId}`
        }))
      })

  return (
    <div className="chat-area">
      <div className="chat-messages" ref={messageContainerRef}>
        {isLoading ? (
          <div className="spinner-container">
            <Spin />
          </div>
        ) : selectTicketId ? (
          (() => {
            const parseDate = (dateString) => {
              if (!dateString) return null
              const [date, time] = dateString.split(" ")
              if (!date || !time) return null
              const [day, month, year] = date.split("-")
              return new Date(`${year}-${month}-${day}T${time}`)
            }

            const sortedMessages = messages
              .filter((msg) => msg.ticket_id === selectTicketId)
              .sort((a, b) => parseDate(a.time_sent) - parseDate(b.time_sent))

            const groupedMessages = []
            let lastClientId = null

            sortedMessages.forEach((msg) => {
              const messageDate =
                parseDate(msg.time_sent)?.toLocaleDateString("ru-RU", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                }) || "—"

              const currentClientId = Array.isArray(msg.client_id)
                ? msg.client_id[0].toString()
                : msg.client_id.toString()
              let lastGroup =
                groupedMessages.length > 0
                  ? groupedMessages[groupedMessages.length - 1]
                  : null

              if (
                !lastGroup ||
                lastGroup.date !== messageDate ||
                lastClientId !== currentClientId
              ) {
                lastClientId = currentClientId
                groupedMessages.push({
                  date: messageDate,
                  clientId: currentClientId,
                  messages: [msg]
                })
              } else {
                lastGroup.messages.push(msg)
              }
            })

            return groupedMessages.map(
              ({ date, clientId, messages }, index) => {
                const clientInfo = personalInfo[clientId] || {}
                const clientName = clientInfo.name
                  ? `${clientInfo.name} ${clientInfo.surname || ""}`
                  : `ID: ${clientId}`

                return (
                  <div key={index} className="message-group-container-chat">
                    <div className="message-date-separator">📆 {date}</div>
                    <div className="client-message-group">
                      <div className="client-header">
                        👤 {translations["Mesajele clientului"][language]} #
                        {clientId} - {clientName}
                      </div>
                      {messages.map((msg, msgIndex) => {
                        const uniqueKey = `${msg.id || msg.ticket_id}-${msg.time_sent}-${msgIndex}`

                        const renderContent = () => {
                          if (!msg.message) {
                            return (
                              <div className="text-message">
                                {translations["Mesajul lipseste"][language]}
                              </div>
                            )
                          }
                          switch (msg.mtype) {
                            case "image":
                              return (
                                <img
                                  src={msg.message}
                                  alt="Изображение"
                                  className="image-preview-in-chat"
                                  // onError={(e) => {
                                  //   e.target.src =
                                  //     "https://via.placeholder.com/300?text=Ошибка+загрузки"
                                  // }}
                                  onClick={() => {
                                    window.open(msg.message, "_blank")
                                  }}
                                />
                              )
                            case "video":
                              return (
                                <video controls className="video-preview">
                                  <source src={msg.message} type="video/mp4" />
                                  {
                                    translations[
                                      "Acest browser nu suporta video"
                                    ][language]
                                  }
                                </video>
                              )
                            case "audio":
                              return (
                                <audio controls className="audio-preview">
                                  <source src={msg.message} type="audio/ogg" />
                                  {
                                    translations[
                                      "Acest browser nu suporta audio"
                                    ][language]
                                  }
                                </audio>
                              )
                            case "file":
                              return (
                                <a
                                  href={msg.message}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="file-link"
                                >
                                  {translations["Deschide file"][language]}
                                </a>
                              )
                            default:
                              return (
                                <div className="text-message">
                                  {msg.message}
                                </div>
                              )
                          }
                        }

                        const lastReaction = getLastReaction(msg)

                        return (
                          <div
                            key={uniqueKey}
                            className={`message ${msg.sender_id === userId || msg.sender_id === 1 ? "sent" : "received"}`}
                          >
                            <div className="message-content">
                              <div className="message-row">
                                <div
                                  style={{
                                    fontSize: "30px",
                                    marginRight: "8px"
                                  }}
                                >
                                  {platformIcons[msg.platform] || null}
                                </div>

                                <div className="text">
                                  {renderContent()}
                                  <div className="message-time">
                                    {msg.sender_id !== 1 &&
                                      msg.sender_id !== userId &&
                                      (() => {
                                        const cleanClientId = String(
                                          msg.client_id
                                        ).replace(/[{}]/g, "")
                                        const clientInfo =
                                          personalInfo[cleanClientId]

                                        return (
                                          <span className="client-name">
                                            {clientInfo
                                              ? `${clientInfo.name} ${clientInfo.surname || ""}`
                                              : "Неизвестный"}
                                          </span>
                                        )
                                      })()}
                                    <div
                                      className="reaction-toggle-button"
                                      onClick={() =>
                                        setSelectedMessageId(
                                          selectedMessageId === msg.id
                                            ? null
                                            : msg.id
                                        )
                                      }
                                    >
                                      {lastReaction || "☺"}
                                    </div>
                                    <div className="time-messages">
                                      {parseDate(
                                        msg.time_sent
                                      )?.toLocaleTimeString("ru-RU", {
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      }) || "—"}
                                    </div>
                                  </div>
                                  {selectedMessageId === msg.id && (
                                    <div
                                      className="reaction-container"
                                      ref={reactionContainerRef}
                                    >
                                      <div className="reaction-buttons">
                                        {[
                                          "☺",
                                          "👍",
                                          "❤️",
                                          "😂",
                                          "😮",
                                          "😢",
                                          "😡"
                                        ].map((reaction) => (
                                          <div
                                            key={reaction}
                                            onClick={() =>
                                              handleReactionClick(
                                                reaction,
                                                msg.id
                                              )
                                            }
                                            className={
                                              selectedReaction[msg.id] ===
                                              reaction
                                                ? "active"
                                                : ""
                                            }
                                          >
                                            {reaction}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              }
            )
          })()
        ) : (
          <div className="empty-chat">
            <p>{translations["Alege lead"][language]}</p>
          </div>
        )}
      </div>
      {selectTicketId && (
        <TaskListOverlay
          tasks={listTask}
          fetchTasks={fetchTasks}
          ticketId={selectTicketId}
          userId={userId}
          openEditTask={openEditTask}
        />
      )}

      <Box p="24">
        <ChatInput
          inputValue={managerMessage ?? ""}
          onChangeTextArea={setManagerMessage}
          id={selectTicketId}
          onSendMessage={handleClick}
          onHandleFileSelect={handleFileSelect}
          renderSelectUserPlatform={() => {
            return (
              tickets &&
              tickets.find((ticket) => ticket.id === selectTicketId)
                ?.client_id && (
                <Select
                  w="100%"
                  value={`${selectedClient}-${selectedPlatform}`}
                  placeholder={translations["Alege client"][language]}
                  data={usersOptions().flat()}
                  onChange={(value, b) => {
                    // const [clientId, platform] = value.split("-")
                    // setSelectedClient(clientId)
                    // setSelectedPlatform(platform)
                  }}
                />
              )
            )
          }}
        />

        {/* {tickets &&
          tickets.find((ticket) => ticket.id === selectTicketId)?.client_id && (
            <div className="client-select-container">
              <select
                className="task-select"
                value={`${selectedClient}-${selectedPlatform}`}
                onChange={(e) => {
                  const [clientId, platform] = e.target.value.split("-")
                  setSelectedClient(clientId)
                  setSelectedPlatform(platform)
                }}
              >
                <option value="" disabled>
                  {translations["Alege client"][language]}
                </option>
                {tickets
                  .find((ticket) => ticket.id === selectTicketId)
                  .client_id.replace(/[{}]/g, "")
                  .split(",")
                  .map((id) => {
                    const clientId = id.trim()
                    const clientInfo = personalInfo[clientId] || {}
                    const fullName = clientInfo.name
                      ? `${clientInfo.name} ${clientInfo.surname || ""}`.trim()
                      : `ID: ${clientId}`

                    const clientMessages = messages.filter(
                      (msg) => msg.client_id === Number(clientId)
                    )
                    const uniquePlatforms = [
                      ...new Set(clientMessages.map((msg) => msg.platform))
                    ]

                    return uniquePlatforms.map((platform) => (
                      <option
                        key={`${clientId}-${platform}`}
                        value={`${clientId}-${platform}`}
                      >
                        {` ${fullName} | ${platform.charAt(0).toUpperCase() + platform.slice(1)} | ID: ${clientId} `}
                      </option>
                    ))
                  })}
              </select>
            </div>
          )} */}
      </Box>
    </div>
  )
}

export default ChatMessages
