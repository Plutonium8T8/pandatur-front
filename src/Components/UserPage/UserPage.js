import React, { useState, useEffect } from "react"
import { useUser } from "../../hooks"
import "./UserProfile.css"
import { FaUser } from "react-icons/fa"
import { translations } from "../utils/translations"
import { api } from "../../api"
import { useSnackbar } from "notistack"
import { showServerError } from "../../Components/utils/showServerError"
import { Input } from "../Input"

const UserPage = ({ isOpen, onClose }) => {
  const { userId } = useUser()
  const [error, setError] = useState(null)
  const { enqueueSnackbar } = useSnackbar()

  const language = localStorage.getItem("language") || "RO"

  const [users, setUsers] = useState({
    username: "",
    email: ""
  })

  const [usersExtended, setUsersExtended] = useState({
    name: "",
    surname: "",
    date_of_birth: "",
    id_card_series: "",
    id_card_number: "",
    id_card_release: "",
    idnp: "",
    address: "",
    phone: ""
  })

  const [usersTechnician, setUsersTechnician] = useState({
    policy_number: "",
    personal_exemption_number: "",
    job_title: "",
    department: ""
  })

  useEffect(() => {
    if (isOpen) {
      fetchUserData()
    }
  }, [isOpen])

  const fetchUserData = async () => {
    try {
      const userData = await api.users.getById(userId)

      setUsers((prev) => ({
        ...prev,
        username: userData.username || "",
        email: userData.email || ""
      }))

      const extendedData = await api.users.getExtendedById(userId)

      setUsersExtended((prev) => ({
        ...prev,
        name: extendedData.name || "",
        surname: extendedData.surname || "",
        date_of_birth: extendedData.date_of_birth || "",
        id_card_series: extendedData.id_card_series || "",
        id_card_number: extendedData.id_card_number || "",
        id_card_release: extendedData.id_card_release || "",
        idnp: extendedData.idnp || "",
        address: extendedData.address || "",
        phone: extendedData.phone || ""
      }))

      const technicianData = await api.users.getTechnicianById(userId)

      setUsersTechnician((prev) => ({
        ...prev,
        policy_number: technicianData.policy_number || "",
        personal_exemption_number:
          technicianData.personal_exemption_number || "",
        job_title: technicianData.job_title || "",
        department: technicianData.department || ""
      }))
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" })
      console.error("Error fetching user data:", error.message)
    }
  }

  const handleUsersChange = (e) => {
    const { name, value } = e.target
    setUsers((prev) => ({ ...prev, [name]: value }))
  }

  const handleUsersExtendedChange = (e) => {
    const { name, value } = e.target
    setUsersExtended((prev) => ({ ...prev, [name]: value }))
  }

  const handleUsersTechnicianChange = (e) => {
    const { name, value } = e.target
    setUsersTechnician((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.users.updateUser(userId, {
        email: users.email,
        username: users.username
      })

      await api.users.updateExtended(userId, {
        name: usersExtended.name,
        surname: usersExtended.surname,
        address: usersExtended.address,
        date_of_birth: usersExtended.date_of_birth,
        id_card_number: usersExtended.id_card_number,
        id_card_release: usersExtended.id_card_release,
        id_card_series: usersExtended.id_card_series,
        idnp: usersExtended.idnp,
        phone: usersExtended.phone
      })

      await api.users.updateTechnician(userId, {
        department: usersTechnician.department,
        job_title: usersTechnician.job_title,
        personal_exemption_number: usersTechnician.personal_exemption_number,
        policy_number: usersTechnician.policy_number
      })

      onClose()
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" })
      console.error("Error saving user data:", error.message)
      setError("Error saving user data.")
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="userSlideInModal">
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <header className="modal-header">
            <h2>
              <FaUser />
              {translations["Gestionare utilizatori"][language]}
            </h2>
          </header>
          <form className="user-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <h3>{translations["Informații utilizator"][language]}</h3>
              {Object.keys(users)
                .filter(
                  (attribute) =>
                    ![
                      "password",
                      "roles",
                      "email_confirmed",
                      "password_reset_token",
                      "password_reset_requested_at",
                      "id"
                    ].includes(attribute)
                )
                .map((key) => (
                  <Input
                    key={key}
                    name={key}
                    placeholder={translations[key]?.[language] || ""}
                    value={users[key] || ""}
                    onChange={handleUsersChange}
                  />
                ))}
            </div>

            <div className="input-group">
              <h3>{translations["Informații extinse"][language]}</h3>
              {Object.keys(usersExtended)
                .filter(
                  (attribute) => !["user", "photo", "id"].includes(attribute)
                )
                .map((key) => (
                  <Input
                    key={key}
                    type={
                      ["date_of_birth", "id_card_release"].includes(key)
                        ? "date"
                        : "text"
                    }
                    name={key}
                    placeholder={translations[key]?.[language] || ""}
                    value={usersExtended[key] || ""}
                    onChange={handleUsersExtendedChange}
                  />
                ))}
            </div>

            <div className="input-group">
              <h3>{translations["Informații manager"][language]}</h3>
              {Object.keys(usersTechnician)
                .filter((attribute) => !["id", "salary"].includes(attribute))
                .map((key) => (
                  <Input
                    key={key}
                    name={key}
                    placeholder={translations[key]?.[language] || ""}
                    value={usersTechnician[key] || ""}
                    onChange={handleUsersTechnicianChange}
                  />
                ))}
            </div>

            <div className="button-container">
              <button type="submit" className="submit-button">
                {translations["Salvează"][language]}
              </button>
              <button type="button" className="clear-button" onClick={onClose}>
                {translations["Închide"][language]}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UserPage
