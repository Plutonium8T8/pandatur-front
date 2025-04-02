import React, { useState, useEffect, useRef } from "react"
import { FaFile, FaPaperPlane, FaSmile } from "react-icons/fa"
import EmojiPicker from "emoji-picker-react"
import ReactDOM from "react-dom"
import { Flex } from "@mantine/core"
import { useApp, useUser } from "../../hooks"
import { api } from "../../api"
import TaskListOverlay from "../Task/Components/TicketTask/TaskListOverlay"
import { translations } from "../utils/translations"
import { templateOptions } from "../../FormOptions/MessageTemplate"
import { Spin } from "../Spin"
import { getMediaType } from "./utils"
import { GroupedMessages } from "./components"

const language = localStorage.getItem("language") || "RO"

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

  const [managerMessage, setManagerMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0
  })
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const messageContainerRef = useRef(null)
  const fileInputRef = useRef(null)
  const reactionContainerRef = useRef(null)
  const [isUserAtBottom, setIsUserAtBottom] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState("web")
  const [tasks, setTasks] = useState([])
  const [listTask, setListTask] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)

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

  const handleEmojiClick = (emojiObject) => {
    setManagerMessage((prev) => prev + emojiObject.emoji)
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

  const handleEmojiClickButton = (event) => {
    const rect = event.target.getBoundingClientRect()
    const emojiPickerHeight = 450

    setEmojiPickerPosition({
      top: rect.top + window.scrollY - emojiPickerHeight,
      left: rect.left + window.scrollX
    })

    setShowEmojiPicker((prev) => !prev)
  }

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleSelectTemplateChange = (event) => {
    const selectedKey = event.target.value

    if (selectedKey) {
      setSelectedMessage(selectedKey)
      setManagerMessage(templateOptions[selectedKey])
    } else {
      setSelectedMessage(null)
      setManagerMessage("")
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

  return (
    <Flex w="50%" direction="column" className="chat-area">
      <Flex
        h="100vh"
        p="16"
        direction="column"
        className="chat-messages"
        ref={messageContainerRef}
      >
        {isLoading ? (
          <Flex h="100%" align="center" justify="center">
            <Spin />
          </Flex>
        ) : selectTicketId ? (
          <GroupedMessages
            personalInfo={personalInfo}
            selectTicketId={selectTicketId}
          />
        ) : (
          <div className="empty-chat">
            <p>{translations["Alege lead"][language]}</p>
          </div>
        )}
      </Flex>
      {selectTicketId && (
        <TaskListOverlay
          tasks={listTask}
          fetchTasks={fetchTasks}
          ticketId={selectTicketId}
          userId={userId}
          openEditTask={openEditTask}
        />
      )}
      <div className="manager-send-message-container">
        <textarea
          className="text-area-message"
          value={managerMessage ?? ""}
          onChange={(e) => setManagerMessage(e.target.value)}
          placeholder={translations["Introduceți mesaj"][language]}
          disabled={!selectTicketId}
        />
        <div className="message-options">
          <div className="button-row">
            <button
              className="action-button send-button"
              onClick={handleClick}
              disabled={!selectTicketId}
            >
              <FaPaperPlane />
            </button>
            <button
              className="action-button emoji-button"
              onClick={handleEmojiClickButton}
              disabled={!selectTicketId}
            >
              <FaSmile />
            </button>
            {showEmojiPicker &&
              ReactDOM.createPortal(
                <div
                  className="emoji-picker-popup"
                  style={{
                    position: "absolute",
                    top: emojiPickerPosition.top,
                    left: emojiPickerPosition.left,
                    zIndex: 1000
                  }}
                  onMouseEnter={() => setShowEmojiPicker(true)}
                  onMouseLeave={() => setShowEmojiPicker(false)}
                >
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>,
                document.body
              )}
            <input
              type="file"
              accept="image/*,audio/mp3,video/mp4,application/pdf,audio/ogg"
              onChange={handleFileSelect}
              ref={fileInputRef}
              style={{ display: "none" }}
            />
            <button
              className="action-button file-button"
              disabled={!selectTicketId}
              onClick={handleFileButtonClick}
            >
              <FaFile />
            </button>
          </div>
          <div className="select-row">
            <div className="input-group">
              <label htmlFor="message-template"></label>
              <select
                id="message-template"
                className="task-select"
                value={selectedMessage ?? ""}
                onChange={handleSelectTemplateChange}
              >
                <option value="">
                  {translations["Introduceți mesaj"]?.[language] ??
                    translations[""]?.[language]}
                </option>

                {Object.entries(templateOptions).map(([key, value]) => (
                  <option key={key} value={key}>
                    {translations[key]?.[language] ?? key}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {tickets &&
            tickets.find((ticket) => ticket.id === selectTicketId)
              ?.client_id && (
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
            )}
        </div>
      </div>
    </Flex>
  )
}

export default ChatMessages
