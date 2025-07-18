// import { forwardRef } from "react";
// import { FaTrash, FaEdit } from "react-icons/fa";
// import { TbLayoutKanbanFilled } from "react-icons/tb";
// import { IoMdAdd, IoMdClose } from "react-icons/io";
// import { LuFilter } from "react-icons/lu";
// import { FaList } from "react-icons/fa6";
// import {
//   Button,
//   ActionIcon,
//   Input,
//   SegmentedControl,
//   Flex,
//   Select,
// } from "@mantine/core";
// import { useApp } from "../../../hooks";
// import { VIEW_MODE } from "../utils";
// import { getLanguageByKey } from "../../utils";
// import { PageHeader } from "../../PageHeader";
// import Can from "../../CanComponent/Can";
// import { groupTitleOptions } from "../../../FormOptions";
// import "./LeadsFilter.css";

// export const RefLeadsHeader = forwardRef(
//   (
//     {
//       openCreateTicketModal,
//       searchTerm,
//       setSearchTerm,
//       onChangeViewMode,
//       selectedTickets,
//       onOpenModal,
//       setIsFilterOpen,
//       deleteTicket,
//       totalTicketsFiltered,
//       hasOpenFiltersModal,
//       tickets,
//     },
//     ref,
//   ) => {
//     const {
//       isCollapsed,
//       accessibleGroupTitles,
//       customGroupTitle,
//       setCustomGroupTitle,
//       groupTitleForApi,
//     } = useApp();

//     const { kanbanFilterActive } = useApp();

//     const selectedTicket = tickets.find((t) => t.id === selectedTickets?.[0]);
//     const responsibleId = selectedTicket?.technician_id
//       ? String(selectedTicket.technician_id)
//       : undefined;

//     const groupTitleSelectData = groupTitleOptions.filter((option) =>
//       accessibleGroupTitles.includes(option.value)
//     );

//     return (
//       <Flex
//         ref={ref}
//         className="leads-header-container"
//         style={{
//           "--side-bar-width": isCollapsed ? "79px" : "249px",
//         }}
//       >
//         <PageHeader
//           count={tickets.length}
//           extraInfo={
//             <>
//               {selectedTickets.length > 0 && (
//                 <Can permission={{ module: "leads", action: "delete" }} context={{ responsibleId }}>
//                   <Button variant="danger" leftSection={<FaTrash size={16} />} onClick={deleteTicket}>
//                     {getLanguageByKey("Ștergere")} ({selectedTickets.length})
//                   </Button>
//                 </Can>
//               )}

//               {selectedTickets.length > 0 && (
//                 <Can permission={{ module: "leads", action: "edit" }} context={{ responsibleId }}>
//                   <Button variant="warning" leftSection={<FaEdit size={16} />} onClick={onOpenModal}>
//                     {getLanguageByKey("Editare")} ({selectedTickets.length})
//                   </Button>
//                 </Can>
//               )}

//               <ActionIcon
//                 variant={hasOpenFiltersModal || kanbanFilterActive ? "filled" : "default"} // 🔥 изменено
//                 size="36"
//                 onClick={() => setIsFilterOpen(true)}
//               >
//                 <LuFilter size={16} />
//               </ActionIcon>

//               <Input
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 placeholder={getLanguageByKey("Cauta dupa Lead, Client sau Tag")}
//                 className="min-w-300"
//                 rightSectionPointerEvents="all"
//                 rightSection={
//                   searchTerm && (
//                     <IoMdClose className="pointer" onClick={() => setSearchTerm("")} />
//                   )
//                 }
//               />

//               <Select
//                 placeholder={getLanguageByKey("filter_by_group")}
//                 value={customGroupTitle ?? groupTitleForApi}
//                 data={groupTitleSelectData}
//                 onChange={setCustomGroupTitle}
//               />

//               <SegmentedControl
//                 onChange={onChangeViewMode}
//                 data={[
//                   { value: VIEW_MODE.KANBAN, label: <TbLayoutKanbanFilled /> },
//                   { value: VIEW_MODE.LIST, label: <FaList /> },
//                 ]}
//               />

//               <Can permission={{ module: "leads", action: "create" }}>
//                 <Button onClick={openCreateTicketModal} leftSection={<IoMdAdd size={16} />}>
//                   {getLanguageByKey("Adaugă lead")}
//                 </Button>
//               </Can>
//             </>
//           }
//           title={getLanguageByKey("Leads")}
//         />
//       </Flex>
//     );
//   }
// );
