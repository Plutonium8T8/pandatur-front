import { forwardRef } from "react"
import { FaTrash, FaEdit } from "react-icons/fa"
import { TbLayoutKanbanFilled } from "react-icons/tb"
import { IoMdAdd } from "react-icons/io"
import { LuFilter } from "react-icons/lu"
import { FaList } from "react-icons/fa6"
import { getLanguageByKey } from "../../utils"
import "./LeadsFilter.css"
import {
  Button,
  ActionIcon,
  Input,
  SegmentedControl,
  Flex
} from "@mantine/core"
import { IoMdClose } from "react-icons/io"

export const RefLeadsFilter = forwardRef(
  (
    {
      openCreateTicketModal,
      searchTerm,
      setSearchTerm,
      setIsTableView,
      selectedTickets,
      onOpenModal,
      setIsFilterOpen,
      deleteTicket,
      setGroupTitle,
      totalTicketsFiltered,
      isFilterOpen
    },
    ref
  ) => {
    return (
      <Flex
        ref={ref}
        justify="space-between"
        align="center"
        className="leads-header-container"
      >
        <Flex align="center" gap="md">
          <Button
            variant="filled"
            onClick={openCreateTicketModal}
            leftSection={<IoMdAdd size={16} />}
          >
            {getLanguageByKey("Adaugă lead")}
          </Button>

          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={getLanguageByKey("Cauta dupa Lead, Client sau Tag")}
            className="leads-header-filter-search"
            rightSectionPointerEvents="all"
            rightSection={
              <IoMdClose
                onClick={() => setSearchTerm("")}
                style={{
                  display: searchTerm ? undefined : "none",
                  cursor: "pointer"
                }}
              />
            }
          />

          <Button variant="default">
            {`${getLanguageByKey("Leads")}: ${totalTicketsFiltered}`}
          </Button>

          {selectedTickets.length > 0 && (
            <Button
              variant="danger"
              leftSection={<FaTrash size={16} />}
              onClick={deleteTicket}
            >
              {getLanguageByKey("Ștergere")} ({selectedTickets.length})
            </Button>
          )}

          {selectedTickets.length > 0 && (
            <Button
              variant="warning"
              leftSection={<FaEdit size={16} />}
              onClick={onOpenModal}
            >
              {getLanguageByKey("Editare")} ({selectedTickets.length})
            </Button>
          )}

          <ActionIcon
            size="36"
            onClick={() => setIsFilterOpen(true)}
            variant={isFilterOpen ? "filled" : "outline"}
          >
            <LuFilter size={16} />
          </ActionIcon>
        </Flex>

        <Flex gap="md">
          <SegmentedControl
            onChange={(value) => {
              setIsTableView((prev) => value === "kanban")
            }}
            data={[
              { value: "list", label: <TbLayoutKanbanFilled /> },
              { value: "kanban", label: <FaList /> }
            ]}
          />

          <SegmentedControl
            onChange={(group) => setGroupTitle(group)}
            data={[
              { value: "", label: getLanguageByKey("Toate") },
              { value: "RO", label: "RO" },
              { value: "MD", label: "MD" },
              { value: "Filiale", label: getLanguageByKey("FIL") },
              { value: "Francize", label: getLanguageByKey("FRA") }
            ]}
          />
        </Flex>
      </Flex>
    )
  }
)
