import { forwardRef } from "react";
import { FaTrash, FaEdit } from "react-icons/fa";
import { TbLayoutKanbanFilled } from "react-icons/tb";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { LuFilter } from "react-icons/lu";
import { FaList } from "react-icons/fa6";
import {
  Button,
  ActionIcon,
  Input,
  SegmentedControl,
  Flex,
  Select,
} from "@mantine/core";
import { useApp } from "../../../hooks";
import { VIEW_MODE } from "../utils";
import { getLanguageByKey } from "../../utils";
import { PageHeader } from "../../PageHeader";
import "./LeadsFilter.css";

export const RefLeadsHeader = forwardRef(
  (
    {
      openCreateTicketModal,
      searchTerm,
      setSearchTerm,
      onChangeViewMode,
      selectedTickets,
      onOpenModal,
      setIsFilterOpen,
      deleteTicket,
      setGroupTitle,
      totalTicketsFiltered,
      hasOpenFiltersModal,
    },
    ref,
  ) => {
    const { isCollapsed } = useApp();

    return (
      <Flex
        ref={ref}
        className="leads-header-container"
        style={{
          "--side-bar-width": isCollapsed ? "79px" : "249px",
        }}
      >
        <PageHeader
          extraInfo={
            <>
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
                variant={hasOpenFiltersModal ? "filled" : "default"}
                size="36"
                onClick={() => setIsFilterOpen(true)}
              >
                <LuFilter size={16} />
              </ActionIcon>

              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={getLanguageByKey(
                  "Cauta dupa Lead, Client sau Tag",
                )}
                className="min-w-300"
                rightSectionPointerEvents="all"
                rightSection={
                  searchTerm && (
                    <IoMdClose
                      className="pointer"
                      onClick={() => setSearchTerm("")}
                    />
                  )
                }
              />

              <Select
                placeholder={getLanguageByKey("filter_by_group")}
                defaultValue=""
                data={[
                  { value: "", label: getLanguageByKey("Toate") },
                  { value: "RO", label: "RO" },
                  { value: "MD", label: "MD" },
                  { value: "Filiale", label: getLanguageByKey("FIL") },
                  { value: "Francize", label: getLanguageByKey("FRA") },
                  {
                    value: "Marketing",
                    label: getLanguageByKey("marketing"),
                  },
                ]}
                onChange={(group) => setGroupTitle(group)}
              />

              <SegmentedControl
                onChange={onChangeViewMode}
                data={[
                  { value: VIEW_MODE.KANBAN, label: <TbLayoutKanbanFilled /> },
                  { value: VIEW_MODE.LIST, label: <FaList /> },
                ]}
              />

              <Button
                onClick={openCreateTicketModal}
                leftSection={<IoMdAdd size={16} />}
              >
                {getLanguageByKey("Adaugă lead")}
              </Button>
            </>
          }
          title={getLanguageByKey("Leads")}
          count={totalTicketsFiltered}
        />
      </Flex>
    );
  },
);
