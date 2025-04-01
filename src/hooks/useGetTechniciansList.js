import { useState, useEffect } from "react"
import { api } from "../api"
import { showServerError } from "../Components/utils"

export const useGetTechniciansList = () => {
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState(null)

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        setLoading(true)
        const data = await api.users.getTechnicianList()

        const formattedTechnicians = data.map((item) => ({
          value: `${item.id.id}`,
          label: `${item.id.surname} ${item.id.name}`
        }))

        setLoading(false)
        setTechnicians(formattedTechnicians)
      } catch (error) {
        setErrors(showServerError(error))
      } finally {
        setLoading(false)
      }
    }

    fetchTechnicians()
  }, [])

  return {
    errors,
    loading,
    technicians
  }
}
