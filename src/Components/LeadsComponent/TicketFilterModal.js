import React, { useState, useEffect, useRef } from "react"
import { priorityOptions } from "../../FormOptions/PriorityOption"
import { workflowOptions } from "../../FormOptions/WorkFlowOption"
import { transportOptions } from "../../FormOptions/TransportOptions"
import { motivulRefuzuluiOptions } from "../../FormOptions/MotivulRefuzuluiOptions"
import { countryOptions } from "../../FormOptions/CountryOptions"
import { marketingOptions } from "../../FormOptions/MarketingOptions"
import { nameExcursionOptions } from "../../FormOptions/NameExcursionOptions"
import { paymentStatusOptions } from "../../FormOptions/PaymentStatusOptions"
import { purchaseProcessingOptions } from "../../FormOptions/PurchaseProcessingOptions"
import { serviceTypeOptions } from "../../FormOptions/ServiceTypeOptions"
import { sourceOfLeadOptions } from "../../FormOptions/SourceOfLeadOptions"
import { promoOptions } from "../../FormOptions/PromoOptions"
import { evaluareOdihnaOptions } from "../../FormOptions/EvaluareVacantaOptions"
import { valutaOptions } from "../../FormOptions/ValutaOptions"
import { ibanOptions } from "../../FormOptions/IbanOptions"
import CustomMultiSelect from "../MultipleSelect/MultipleSelect"
import "./Modal.css"
import { translations } from "../utils/translations"
import { api } from "../../api"
import { platformOptions } from "../../Components/utils/platformOptions"
import { filterDefaults } from "./utils"

const language = localStorage.getItem("language") || "RO"

const TicketFilterModal = ({
  isOpen,
  onClose,
  onApplyFilter,
  filteredTicketIds
}) => {
  const [technicians, setTechnicians] = useState([])
  const modalRef = useRef(null)

  const filterGroups = {
    General: ["workflow"],
    Ticket: [
      "creation_date",
      "last_interaction_date",
      "priority",
      "technician_id",
      "tags",
      "tipul_serviciului",
      "tara",
      "tip_de_transport",
      "denumirea_excursiei_turului",
      "procesarea_achizitionarii",
      "data_venit_in_oficiu",
      "data_plecarii",
      "data_intoarcerii",
      "data_cererii_de_retur",
      "buget",
      "sursa_lead",
      "status_sunet_telefonic",
      "promo",
      "marketing"
    ],
    Messages: ["platform"]
  }

  const handleApplyFilter = async () => {
    const { workflow, platform, tags, ...formattedFilters } = filters

    if (Array.isArray(tags) && tags.length > 0) {
      formattedFilters.tags = tags.join(",")
    }

    if (Array.isArray(tags) && tags.length > 0) {
      formattedFilters.tags = `{${tags.join(",")}}`
    } else {
      delete formattedFilters.tags
    }

    const hasValidFilters = Object.values(formattedFilters).some((value) =>
      Array.isArray(value) ? value.length > 0 : value
    )

    if (!hasValidFilters) {
      console.warn("⚠️ Фильтры пустые, запрос не отправляется.")
      return
    }

    console.log("🚀 Отправляем данные в API:", formattedFilters)

    try {
      const ticketData = await api.standalone.applyFilter(formattedFilters)
      const ticketIds = ticketData.flat().map((ticket) => ticket.id)

      console.log("✅ Отфильтрованные ID тикетов:", ticketIds)
      onApplyFilter(filters, ticketIds.length > 0 ? ticketIds : [])
      onClose()
    } catch (error) {
      console.error("❌ Ошибка при фильтрации:", error)
    }
  }

  const tabs = Object.keys(filterGroups)
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [filters, setFilters] = useState(filterDefaults)

  useEffect(() => {
    console.log("✅ Модальное окно открыто, текущие фильтры:", filters)
  }, [isOpen])

  useEffect(() => {
    console.log("🔹 Фильтр workflow изменился:", filters.workflow)
  }, [filters.workflow])

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const data = await api.users.getTechnicianList()

        const formattedTechnicians = data.map((item) =>
          `${item.id.id}: ${item.id.name} ${item.id.surname}`.trim()
        )
        setTechnicians(formattedTechnicians)
      } catch (error) {
        console.error("Ошибка при загрузке техников:", error)
        setTechnicians([])
      }
    }

    if (isOpen) fetchTechnicians()
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleTabClick = (tab) => {
    setActiveTab(tab)
  }

  const handleApplyLocalFilter = () => {
    console.log("🔹 Локальное применение фильтра:", filters.workflow)
    onApplyFilter(filters, filteredTicketIds)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    setFilters((prev) => ({
      ...prev,
      [name]:
        name === "tags" ? value.split(",").map((tag) => tag.trim()) : value
    }))

    const field = document.querySelector(`[name="${name}"]`)
    if (field) {
      if (value && value.length > 0) {
        field.classList.add("filled-field")
      } else {
        field.classList.remove("filled-field")
      }
    }
  }

  const handleMultiSelectChange = (name, selectedValues) => {
    setFilters((prev) => ({
      ...prev,
      [name]: selectedValues
    }))

    const field = document.querySelector(`[name="${name}"]`)
    if (field) {
      if (selectedValues.length > 0) {
        field.classList.add("filled-field")
      } else {
        field.classList.remove("filled-field")
      }
    }
  }

  const handleResetFilters = () => {
    console.log("♻️ Сброс фильтров до значений по умолчанию")

    const resetFilters = {
      ...filterDefaults,
      workflow: filterDefaults.workflow || []
    }

    setFilters(resetFilters)

    onApplyFilter(resetFilters, null)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay-filter">
      <div className="modal-content-filter" ref={modalRef}>
        <div className="filter-container">
          <div className="tabs">
            {tabs.map((tab) => (
              <div
                key={tab}
                className={`tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => handleTabClick(tab)}
              >
                {tab}
              </div>
            ))}
          </div>

          <div className="filters">
            {filterGroups[activeTab].includes("workflow") && (
              <>
                <h2>{translations["Filtru de sistem"][language]}</h2>
                <div className="workflow-multi-select">
                  <label>{translations["Workflow"][language]}</label>
                  <CustomMultiSelect
                    options={workflowOptions}
                    placeholder={
                      translations["Alege workflow pentru afisare in sistem"][
                        language
                      ]
                    }
                    onChange={(values) =>
                      handleMultiSelectChange("workflow", values)
                    }
                    selectedValues={filters.workflow}
                  />
                </div>
                <div className="modal-buttons">
                  <button
                    onClick={handleApplyLocalFilter}
                    className="apply-btn"
                  >
                    {translations["Aplica filtru"][language]}
                  </button>
                  <button onClick={handleResetFilters} className="reset-btn">
                    {translations["Reset filter"][language]}
                  </button>
                  <button onClick={onClose} className="cancel-btn">
                    {translations["Close"][language]}
                  </button>
                </div>
              </>
            )}

            {filterGroups[activeTab].includes("tags") && (
              <>
                <h2>{translations["Filtru pentru Lead"][language]}</h2>
                <div className="container-extra-group">
                  <label>{translations["Data creare Lead"][language]}</label>
                  <input
                    type="date"
                    name="creation_date"
                    value={filters.creation_date || ""}
                    onChange={handleInputChange}
                    className={filters.numar_de_contract ? "filled-field" : ""}
                  />
                  <label>
                    {translations["Data ultima actualizare Lead"][language]}
                  </label>
                  <input
                    type="date"
                    name="last_interaction_date"
                    value={filters.last_interaction_date || ""}
                    onChange={handleInputChange}
                    className={
                      filters.last_interaction_date ? "filled-field" : ""
                    }
                  />
                  <label>{translations["Prioritate Lead"][language]}</label>
                  <CustomMultiSelect
                    options={priorityOptions}
                    placeholder={translations["Alege prioritatea"][language]}
                    onChange={(values) =>
                      handleMultiSelectChange("priority", values)
                    }
                    selectedValues={filters.priority}
                  />
                  <label>{translations["Responsabil Lead"][language]}</label>
                  <CustomMultiSelect
                    options={technicians}
                    placeholder={
                      translations["Alege responsabil lead"][language]
                    }
                    onChange={(values) =>
                      handleMultiSelectChange("technician_id", values)
                    }
                    selectedValues={filters.technician_id}
                  />

                  <label>{translations["Tag-uri"][language]}</label>
                  <input
                    type="text"
                    name="tags"
                    value={
                      filters.tags.length > 0 ? filters.tags.join(", ") : ""
                    }
                    onChange={handleInputChange}
                    placeholder={
                      translations["Introdu tag-uri separate prin virgule"][
                        language
                      ]
                    }
                    className={filters.tags.length > 0 ? "filled-field" : ""}
                  />
                  <label>{translations["Sursa Lead"][language]}</label>
                  <CustomMultiSelect
                    options={sourceOfLeadOptions}
                    placeholder={translations["Alege sursa lead"][language]}
                    onChange={(values) =>
                      handleMultiSelectChange("sursa_lead", values)
                    }
                    selectedValues={filters.sursa_lead}
                  />

                  <label>{translations["Promo"][language]}</label>
                  <CustomMultiSelect
                    options={promoOptions}
                    placeholder={translations["Alege promo"][language]}
                    onChange={(values) =>
                      handleMultiSelectChange("promo", values)
                    }
                    selectedValues={filters.promo}
                  />

                  <label>{translations["Marketing"][language]}</label>
                  <CustomMultiSelect
                    options={marketingOptions}
                    placeholder={translations["Alege marketing"][language]}
                    onChange={(values) =>
                      handleMultiSelectChange("marketing", values)
                    }
                    selectedValues={filters.marketing}
                  />

                  <label>{translations["Tara"][language]}</label>
                  <CustomMultiSelect
                    options={countryOptions}
                    placeholder={translations["Alege tara"][language]}
                    onChange={(values) =>
                      handleMultiSelectChange("tara", values)
                    }
                    selectedValues={filters.tara}
                  />

                  <label>{translations["Transport"][language]}</label>
                  <CustomMultiSelect
                    options={transportOptions}
                    placeholder={translations["Alege transport"][language]}
                    onChange={(values) =>
                      handleMultiSelectChange("tip_de_transport", values)
                    }
                    selectedValues={filters.tip_de_transport}
                  />

                  <label>{translations["Nume excursie"][language]}</label>
                  <CustomMultiSelect
                    options={nameExcursionOptions}
                    placeholder={translations["Alege excursie"][language]}
                    onChange={(values) =>
                      handleMultiSelectChange(
                        "denumirea_excursiei_turului",
                        values
                      )
                    }
                    selectedValues={filters.denumirea_excursiei_turului}
                  />

                  <label>
                    {translations["Data vizita in oficiu"][language]}
                  </label>
                  <input
                    type="datetime-local"
                    name="data_venit_in_oficiu"
                    value={filters.data_venit_in_oficiu || ""}
                    onChange={handleInputChange}
                    className={
                      filters.data_venit_in_oficiu ? "filled-field" : ""
                    }
                  />

                  <label>{translations["Data plecarii"][language]}</label>
                  <input
                    type="datetime-local"
                    name="data_plecarii"
                    value={filters.data_plecarii || ""}
                    onChange={handleInputChange}
                    className={filters.data_plecarii ? "filled-field" : ""}
                  />

                  <label>{translations["Data intoarcerii"][language]}</label>
                  <input
                    type="datetime-local"
                    name="data_intoarcerii"
                    value={filters.data_intoarcerii || ""}
                    onChange={handleInputChange}
                    className={filters.data_intoarcerii ? "filled-field" : ""}
                  />

                  <label>{translations["Vânzare"][language]} €</label>
                  <input
                    type="number"
                    name="buget"
                    value={filters.buget || ""}
                    onChange={handleInputChange}
                    placeholder={
                      translations["Indicați suma în euro"][language]
                    }
                    className={filters.buget ? "filled-field" : ""}
                  />

                  <label>{translations["Tipul serviciului"][language]}</label>
                  <CustomMultiSelect
                    options={serviceTypeOptions}
                    placeholder={translations["Alege serviciu"][language]}
                    onChange={(values) =>
                      handleMultiSelectChange("tipul_serviciului", values)
                    }
                    selectedValues={filters.tipul_serviciului}
                  />

                  <label>
                    {translations["Procesare achizitionarii"][language]}
                  </label>
                  <CustomMultiSelect
                    options={purchaseProcessingOptions}
                    placeholder={translations["Alege achiziție"][language]}
                    onChange={(values) =>
                      handleMultiSelectChange(
                        "procesarea_achizitionarii",
                        values
                      )
                    }
                    selectedValues={filters.procesarea_achizitionarii}
                  />

                  <label>
                    {translations["Data cererii de retur"][language]}
                  </label>
                  <input
                    type="datetime-local"
                    name="data_cererii_de_retur"
                    value={filters.data_cererii_de_retur || ""}
                    onChange={handleInputChange}
                    className={
                      filters.data_cererii_de_retur ? "filled-field" : ""
                    }
                  />
                </div>

                <div className="container-extra-group">
                  <h3>{translations["Contract"][language]}</h3>

                  <label>{translations["Nr de contract"][language]}</label>
                  <input
                    type="text"
                    name="numar_de_contract"
                    value={filters.numar_de_contract || ""}
                    onChange={handleInputChange}
                    placeholder={translations["Nr de contract"][language]}
                    className={filters.numar_de_contract ? "filled-field" : ""}
                  />

                  <label>{translations["Data contractului"][language]}</label>
                  <input
                    type="datetime-local"
                    name="data_contractului"
                    value={filters.data_contractului || ""}
                    onChange={handleInputChange}
                    className={filters.data_contractului ? "filled-field" : ""}
                  />

                  <div className="toggle-container">
                    <label className="toggle-label">
                      {translations["Contract trimis"][language]}
                    </label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(filters.contract_trimis)}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            contract_trimis: e.target.checked
                          }))
                        }
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="toggle-container">
                    <label className="toggle-label">
                      {translations["Contract semnat"][language]}
                    </label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(filters.contract_semnat)}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            contract_semnat: e.target.checked
                          }))
                        }
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <label>{translations["Operator turistic"][language]}</label>
                  <input
                    type="text"
                    name="tour_operator"
                    value={filters.tour_operator || ""}
                    onChange={handleInputChange}
                    placeholder={translations["Operator turistic"][language]}
                    className={filters.tour_operator ? "filled-field" : ""}
                  />

                  <label>
                    {translations["Nr cererii de la operator"][language]}
                  </label>
                  <input
                    type="text"
                    name="numarul_cererii_de_la_operator"
                    value={filters.numarul_cererii_de_la_operator || ""}
                    onChange={handleInputChange}
                    placeholder={
                      translations["Nr cererii de la operator"][language]
                    }
                    className={
                      filters.numarul_cererii_de_la_operator
                        ? "filled-field"
                        : ""
                    }
                  />

                  <div className="toggle-container">
                    <label className="toggle-label">
                      {translations["Achitare efectuată"][language]}
                    </label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(filters.achitare_efectuata)}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            achitare_efectuata: e.target.checked
                          }))
                        }
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="toggle-container">
                    <label className="toggle-label">
                      {translations["Rezervare confirmată"][language]}
                    </label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(filters.rezervare_confirmata)}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            rezervare_confirmata: e.target.checked
                          }))
                        }
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="toggle-container">
                    <label className="toggle-label">
                      {translations["Contract arhivat"][language]}
                    </label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(filters.contract_arhivat)}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            contract_arhivat: e.target.checked
                          }))
                        }
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <label>{translations["Plată primită"][language]}</label>
                  <CustomMultiSelect
                    options={paymentStatusOptions}
                    placeholder={
                      translations["Selectează statutul plății"][language]
                    }
                    onChange={(values) =>
                      handleMultiSelectChange("statutul_platii", values)
                    }
                    selectedValues={filters.statutul_platii}
                  />

                  <label>{translations["Avans euro"][language]} €</label>
                  <input
                    type="number"
                    name="avans_euro"
                    value={filters.avans_euro || ""}
                    onChange={handleInputChange}
                    placeholder={translations["Plată primită"][language]}
                    className={filters.avans_euro ? "filled-field" : ""}
                  />

                  <label>{translations["Data avansului"][language]}</label>
                  <input
                    type="datetime-local"
                    name="data_avansului"
                    value={filters.data_avansului || ""}
                    onChange={handleInputChange}
                    className={filters.data_avansului ? "filled-field" : ""}
                  />

                  <label>
                    {translations["Data de plată integrală"][language]}
                  </label>
                  <input
                    type="datetime-local"
                    name="data_de_plata_integrala"
                    value={filters.data_de_plata_integrala || ""}
                    onChange={handleInputChange}
                    className={
                      filters.data_de_plata_integrala ? "filled-field" : ""
                    }
                  />

                  <label>{translations["Preț NETTO"][language]} €</label>
                  <input
                    type="number"
                    name="pret_netto"
                    value={filters.pret_netto || ""}
                    onChange={handleInputChange}
                    placeholder={translations["Preț NETTO"][language]}
                    className={filters.pret_netto ? "filled-field" : ""}
                  />

                  <label>{translations["Achitat client"][language]}</label>
                  <input
                    type="number"
                    name="achitat_client"
                    value={filters.achitat_client || ""}
                    onChange={handleInputChange}
                    placeholder={translations["Achitat client"][language]}
                    className={filters.achitat_client ? "filled-field" : ""}
                  />

                  <label>{translations["Comision companie"][language]} €</label>
                  <input
                    type="number"
                    name="comission_companie"
                    value={filters.comission_companie || ""}
                    onChange={handleInputChange}
                    placeholder={translations["Comision companie"][language]}
                    className={filters.comission_companie ? "filled-field" : ""}
                  />

                  <div className="toggle-container">
                    <label className="toggle-label">
                      {translations["Control Admin"][language]}
                    </label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(filters.control_admin)}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            control_admin: e.target.checked
                          }))
                        }
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
                <div className="container-extra-group">
                  <h3>{translations["Invoice"][language]}</h3>

                  <label>{translations["F/service"][language]}</label>
                  <input
                    type="text"
                    name="f_serviciu"
                    value={filters.f_serviciu || ""}
                    onChange={handleInputChange}
                    placeholder={translations["F/service"][language]}
                    className={filters.f_serviciu ? "filled-field" : ""}
                  />

                  <label>{translations["F/factura"][language]}</label>
                  <input
                    type="text"
                    name="f_factura"
                    value={filters.f_factura || ""}
                    onChange={handleInputChange}
                    placeholder={translations["F/factura"][language]}
                    className={filters.f_factura ? "filled-field" : ""}
                  />

                  <label>{translations["F/numarul"][language]}</label>
                  <input
                    type="number"
                    name="f_numarul"
                    value={filters.f_numarul || ""}
                    onChange={handleInputChange}
                    placeholder={translations["F/numarul"][language]}
                    className={filters.f_numarul ? "filled-field" : ""}
                  />

                  <label>{translations["F/preț"][language]}</label>
                  <input
                    type="number"
                    name="f_pret"
                    value={filters.f_pret || ""}
                    onChange={handleInputChange}
                    placeholder={translations["F/preț"][language]}
                    className={filters.f_pret ? "filled-field" : ""}
                  />

                  <label>{translations["F/sumă"][language]}</label>
                  <input
                    type="number"
                    name="f_suma"
                    value={filters.f_suma || ""}
                    onChange={handleInputChange}
                    placeholder={translations["F/sumă"][language]}
                    className={filters.f_suma ? "filled-field" : ""}
                  />

                  <label>{translations["Valuta contului"][language]}</label>
                  <CustomMultiSelect
                    options={valutaOptions}
                    placeholder={
                      translations["Selectează valuta contului"][language]
                    }
                    onChange={(values) =>
                      handleMultiSelectChange("valuta_contului", values)
                    }
                    selectedValues={filters.valuta_contului}
                  />

                  <label>{translations["IBAN"][language]}</label>
                  <CustomMultiSelect
                    options={ibanOptions}
                    placeholder={translations["Selectează IBAN"][language]}
                    onChange={(values) =>
                      handleMultiSelectChange("iban", values)
                    }
                    selectedValues={filters.iban}
                  />
                </div>

                <div className="container-extra-group">
                  <h3>{translations["Control calitate"][language]}</h3>

                  <label>{translations["Motivul refuzului"][language]}</label>
                  <CustomMultiSelect
                    options={motivulRefuzuluiOptions}
                    placeholder={translations["Motivul refuzului"][language]}
                    onChange={(values) =>
                      handleMultiSelectChange("motivul_refuzului", values)
                    }
                    selectedValues={filters.motivul_refuzului}
                  />
                  <label>{translations["Evaluare odihnă"][language]}</label>
                  <CustomMultiSelect
                    options={evaluareOdihnaOptions}
                    placeholder={translations["Evaluare odihnă"][language]}
                    onChange={(values) =>
                      handleMultiSelectChange("evaluare_de_odihna", values)
                    }
                    selectedValues={filters.evaluare_de_odihna}
                  />
                  <label>{translations["Următoarea vacanță"][language]}</label>
                  <input
                    type="text"
                    name="urmatoarea_vacanta"
                    value={filters.urmatoarea_vacanta || ""}
                    onChange={handleInputChange}
                    placeholder={translations["Următoarea vacanță"][language]}
                    className={filters.urmatoarea_vacanta ? "filled-field" : ""}
                  />
                  <label>{translations["Manager"][language]}</label>
                  <input
                    type="text"
                    name="manager"
                    value={filters.manager || ""}
                    onChange={handleInputChange}
                    placeholder={translations["Manager"][language]}
                    className={filters.manager ? "filled-field" : ""}
                  />
                  <label>{translations["Vacanța"][language]}</label>
                  <input
                    type="text"
                    name="vacanta"
                    value={filters.vacanta || ""}
                    onChange={handleInputChange}
                    placeholder={translations["Vacanța"][language]}
                    className={filters.vacanta ? "filled-field" : ""}
                  />
                </div>

                <div className="modal-buttons">
                  <button onClick={handleApplyFilter} className="apply-btn">
                    {translations["Aplica filtru"][language]}
                  </button>
                  <button onClick={handleResetFilters} className="reset-btn">
                    {translations["Reset filtru"][language]}
                  </button>
                  <button onClick={onClose} className="cancel-btn">
                    {translations["Close"][language]}
                  </button>
                </div>
              </>
            )}

            {filterGroups[activeTab].includes("platform") && (
              <>
                <h2>
                  {translations["Filtru pentru mesaje (coming soon)"][language]}
                </h2>
                <div className="workflow-multi-select">
                  <label>{translations["Platforma mesaj"][language]}</label>
                  <CustomMultiSelect
                    options={platformOptions}
                    placeholder={translations["Platforma mesaj"][language]}
                    onChange={(values) =>
                      handleMultiSelectChange("platform", values)
                    }
                    selectedValues={filters.platform}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketFilterModal
