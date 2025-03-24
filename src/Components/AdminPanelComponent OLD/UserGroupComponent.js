import React, { useEffect, useState } from "react"
import "./ModalWithToggles.css"
import { FaTrash } from "react-icons/fa"
import { translations } from "../utils/translations"
import { api } from "../../api"
import { useSnackbar } from "notistack"
import { getLanguageByKey } from "../utils/getLanguageByKey"
import { Input } from "../Input/Input"

const UserGroupComponent = ({ onChange, userId, roles }) => {
  const language = localStorage.getItem("language") || "RO"
  const [userGroups, setUserGroups] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [filteredSuggestions, setFilteredSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        const data = await api.user.getGroupsList()

        setUserGroups(data) // Set user groups from API response
        setSuggestions(data.map((group) => group.name)) // Store names for suggestions
      } catch (error) {
        enqueueSnackbar(
          getLanguageByKey("Eroare neașteptată, încercați mai târziu"),
          { variant: "error" }
        )
        console.error("Error fetching user groups:", error)
      }
    }

    fetchUserGroups()
  }, [])

  /**
   * Create and add a new user group with roles.
   */
  const addUserGroup = async (name) => {
    try {
      const newUserGroup = await api.user.createGroup({ name, roles })

      setUserGroups((prev) => [...prev, newUserGroup]) // Add new group to state
      setSuggestions([...suggestions, newUserGroup.name])
      onChange() // Notify parent component
    } catch (error) {
      enqueueSnackbar(
        getLanguageByKey("Eroare neașteptată, încercați mai târziu"),
        { variant: "error" }
      )
    }
  }

  const applyUserGroupRoles = async (groupId, userId) => {
    try {
      await api.user.assignGroups(groupId, userId)

      onChange()
    } catch (error) {
      enqueueSnackbar(
        getLanguageByKey("Eroare neașteptată, încercați mai târziu"),
        { variant: "error" }
      )
      console.error("Error applying user group roles:", error)
    }
  }

  /**
   * Remove a user group from the API and UI.
   */
  const removeUserGroup = async (groupId) => {
    try {
      await api.user.deleteGroups(groupId)

      setUserGroups(userGroups.filter((group) => group.id !== groupId)) // Remove from UI
      onChange(userGroups.filter((group) => group.id !== groupId))
    } catch (error) {
      enqueueSnackbar(
        getLanguageByKey("Eroare neașteptată, încercați mai târziu"),
        { variant: "error" }
      )
      console.error("Error removing user group:", error)
    }
  }

  /**
   * Handle input field changes for user group search.
   */
  const handleInputChange = (e) => {
    const value = e.target.value
    setInputValue(value)

    const filtered = suggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(value.toLowerCase())
    )
    setFilteredSuggestions(filtered)
    setShowSuggestions(true)
  }

  const handleFocus = () => {
    setFilteredSuggestions(suggestions)
    setShowSuggestions(true)
  }

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200)
  }

  return (
    <div className="userGroup-input-container">
      <div className="userGroups-display">
        {userGroups.length === 0 && (
          <div>{translations["Se încarcă..."][language]}</div>
        )}
        {userGroups.map((userGroup) => (
          <div key={userGroup.id} className="userGroup-item">
            <button
              className="apply-userGroup-button"
              onClick={() => applyUserGroupRoles(userGroup.id, userId)}
            >
              <div className="userGroup-text">{userGroup.name}</div>
            </button>
            <button
              className="remove-userGroup-button"
              onClick={() => removeUserGroup(userGroup.id)}
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>
      <div className="input-group">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={translations["Introduce un grup"][language]}
        />
      </div>
      <div className="button-container">
        <button
          onClick={() => {
            if (inputValue.trim()) addUserGroup(inputValue)
          }}
          className="submit-button"
        >
          {translations["Salvează un grup"][language]}
        </button>
      </div>
    </div>
  )
}

export default UserGroupComponent
