import { useState, useMemo } from "react";
import { Flex, Paper, ActionIcon, Text, Checkbox, Box } from "@mantine/core";
import { FaFingerprint } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { useSnackbar } from "notistack";
import { MdDelete, MdEdit } from "react-icons/md";
import { Pagination } from "../../Pagination";
import {
  getLanguageByKey,
  cleanValue,
  showServerError,
  priorityTagColors,
} from "../../utils";
import { TextEllipsis } from "../../TextEllipsis";
import { Tag } from "../../Tag";
import { WorkflowTag } from "../../Workflow/components";
import { RcTable } from "../../RcTable";
import { api } from "../../../api";
import { useConfirmPopup, useUser } from "../../../hooks";
import { ManageLeadInfoTabs } from "../../LeadsComponent/ManageLeadInfoTabs";
import { DateCell } from "../../DateCell";
import { MantineModal } from "../../MantineModal";
import "./LeadTable.css";
import { parseTags } from "../../../stringUtils";
import Can from "../../CanComponent/Can";
import { userGroupsToGroupTitle } from "../../../Components/utils/workflowUtils";

const MAX_COUNT_SLICE = 2;

const renderTags = (tags) => {
  const tagList = parseTags(tags).slice(0, MAX_COUNT_SLICE);
  const isTags = tagList.some(Boolean);
  return isTags ? tagList.map((tag, index) => <Tag key={index}>{tag}</Tag>) : "—";
};

export const LeadTable = ({
  filteredLeads,
  currentPage,
  totalLeadsPages,
  onChangePagination,
  onSelectRow,
  selectTicket,
  fetchTickets,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [id, setId] = useState();
  const { user } = useUser();

  const allowedGroupTitles = useMemo(() => {
    if (!user?.technician?.groups) return [];
    const groupNames = user.technician.groups.map((g) => g.name);
    const titles = groupNames
      .map((name) => userGroupsToGroupTitle[name])
      .flat()
      .filter(Boolean);
    return [...new Set(titles)];
  }, [user]);

  const visibleLeads = useMemo(() => {
    return filteredLeads.filter((ticket) =>
      allowedGroupTitles.includes(ticket.group_title)
    );
  }, [filteredLeads, allowedGroupTitles]);

  const deleteLead = useConfirmPopup({
    subTitle: getLanguageByKey("confirm_delete_lead"),
  });

  const handleDeleteLead = (id) => {
    deleteLead(async () => {
      try {
        await api.tickets.deleteById([id]);
        enqueueSnackbar(getLanguageByKey("lead_deleted_successfully"), {
          variant: "success",
        });
        fetchTickets();
      } catch (error) {
        enqueueSnackbar(showServerError(error), {
          variant: "error",
        });
      }
    });
  };

  const rcColumn = [
    {
      width: 100,
      key: "checkbox",
      dataIndex: "id",
      align: "center",
      render: (id) => (
        <Flex justify="center">
          <Checkbox
            checked={selectTicket.includes(id)}
            onChange={() => onSelectRow(id)}
          />
        </Flex>
      ),
    },
    {
      title: "ID",
      key: "id",
      align: "center",
      dataIndex: "id",
      width: 100,
      render: (id) => (
        <Link to={`/leads/${id}`} className="row-id">
          <Flex align="center" gap="8">
            <FaFingerprint />
            {id}
          </Flex>
        </Link>
      ),
    },
    {
      title: getLanguageByKey("Nume"),
      key: "name",
      dataIndex: "name",
      width: 200,
      align: "center",
      render: (name) => (name ? name : cleanValue()),
    },
    {
      title: getLanguageByKey("Prenume"),
      key: "surname",
      dataIndex: "surname",
      align: "center",
      width: 200,
      render: (surname) => (surname ? surname : cleanValue()),
    },
    {
      title: getLanguageByKey("Email"),
      key: "email",
      dataIndex: "email",
      align: "center",
      width: 200,
      render: (email) =>
        email ? <div className="break-word">{email}</div> : cleanValue(),
    },
    {
      title: getLanguageByKey("Telefon"),
      dataIndex: "phone",
      align: "center",
      width: 150,
      render: (phone) => (phone ? phone : cleanValue()),
    },
    {
      title: getLanguageByKey("Descriere"),
      dataIndex: "description",
      align: "center",
      width: 250,
      render: (description) =>
        description ? (
          <TextEllipsis rows={3}>{description}</TextEllipsis>
        ) : (
          cleanValue()
        ),
    },
    {
      title: getLanguageByKey("Tag-uri"),
      dataIndex: "tags",
      width: 200,
      align: "center",
      render: (tags) => (
        <Flex gap="8" wrap="wrap">
          {renderTags(tags)}
        </Flex>
      ),
    },
    {
      title: getLanguageByKey("Prioritate"),
      dataIndex: "priority",
      align: "center",
      width: 100,
      render: (priority) => (
        <Tag type={priorityTagColors[priority]}>{priority}</Tag>
      ),
    },
    {
      title: getLanguageByKey("Workflow"),
      dataIndex: "workflow",
      align: "center",
      width: 150,
      render: (workflow) => <WorkflowTag type={workflow} />,
    },
    {
      title: getLanguageByKey("Contact"),
      dataIndex: "contact",
      align: "center",
      width: 200,
    },
    {
      title: getLanguageByKey("Data de creare"),
      dataIndex: "creation_date",
      align: "center",
      width: 200,
      render: (date) => (
        <DateCell gap={4} direction="row" justify="center" date={date} />
      ),
    },
    {
      title: getLanguageByKey("Ultima interacțiune"),
      dataIndex: "last_interaction_date",
      align: "center",
      width: 200,
      render: (date) => (
        <DateCell gap={4} direction="row" justify="center" date={date} />
      ),
    },
    {
      title: getLanguageByKey("Achitat client"),
      dataIndex: "achitat_client",
      align: "center",
      render: (achitat_client) => cleanValue(achitat_client),
      width: 150,
    },
    {
      title: getLanguageByKey("Avans în euro"),
      dataIndex: "avans_euro",
      align: "center",
      render: (avans_euro) => cleanValue(avans_euro),
      width: 150,
    },
    {
      title: getLanguageByKey("Comisionul companiei"),
      dataIndex: "comision_companie",
      align: "center",
      render: (comision_companie) => cleanValue(comision_companie),
      width: 200,
    },
    {
      title: getLanguageByKey("Buget"),
      dataIndex: "buget",
      align: "center",
      render: (buget) => cleanValue(buget),
      width: 75,
    },
    {
      title: getLanguageByKey("Data avansului"),
      dataIndex: "data_avansului",
      align: "center",
      width: 150,
      render: (data_avansului) => (
        <DateCell
          gap={4}
          direction="row"
          justify="center"
          date={data_avansului}
        />
      ),
    },
    {
      title: getLanguageByKey("Data cererii de retur"),
      dataIndex: "data_cererii_de_retur",
      align: "center",
      width: 200,
      render: (data_cererii_de_retur) => (
        <DateCell
          gap={4}
          direction="row"
          justify="center"
          date={data_cererii_de_retur}
        />
      ),
    },
    {
      title: getLanguageByKey("Data contractului"),
      dataIndex: "data_contractului",
      align: "center",
      width: 200,
      render: (data_contractului) => (
        <DateCell
          gap={4}
          direction="row"
          justify="center"
          date={data_contractului}
        />
      ),
    },
    {
      title: getLanguageByKey("Data de plată integrală"),
      dataIndex: "data_de_plata_integrala",
      align: "center",
      width: 200,
      render: (data_de_plata_integrala) => (
        <DateCell
          gap={4}
          direction="row"
          justify="center"
          date={data_de_plata_integrala}
        />
      ),
    },
    {
      title: getLanguageByKey("Data plecării"),
      dataIndex: "data_plecarii",
      align: "center",
      width: 200,
      render: (data_plecarii) => (
        <DateCell
          gap={4}
          direction="row"
          justify="center"
          date={data_plecarii}
        />
      ),
    },
    {
      title: getLanguageByKey("Data întoarcerii"),
      dataIndex: "data_intoarcerii",
      align: "center",
      width: 200,
      render: (data_intoarcerii) => (
        <DateCell
          gap={4}
          direction="row"
          justify="center"
          date={data_intoarcerii}
        />
      ),
    },
    {
      title: getLanguageByKey("Tipul de transport"),
      dataIndex: "tip_de_transport",
      align: "center",
      width: 150,
      render: (tip_de_transport) => cleanValue(tip_de_transport),
    },
    {
      title: getLanguageByKey("Vacanță"),
      dataIndex: "vacanta",
      align: "center",
      width: 200,
      render: (vacanta) => cleanValue(vacanta),
    },
    {
      title: getLanguageByKey("Valuta contului"),
      dataIndex: "f_valuta_contului",
      align: "center",
      width: 150,
      render: (valuta_contului) => cleanValue(valuta_contului),
    },
    {
      title: getLanguageByKey("Acțiune"),
      fixed: "right",
      width: 85,
      render: (_, ticket) => {
        const responsibleId = ticket.technician_id?.toString();
        return (
          <Paper
            pos="absolute"
            top="0"
            right="0"
            bottom="0"
            shadow="xs"
            w="100%"
          >
            <Flex align="center" justify="center" gap="8" h="100%" p="xs">
              <Can
                permission={{ module: "leads", action: "delete" }}
                context={{ responsibleId }}
              >
                <ActionIcon
                  variant="danger"
                  onClick={() => handleDeleteLead(ticket.id)}
                >
                  <MdDelete />
                </ActionIcon>
              </Can>
              <Can
                permission={{ module: "leads", action: "edit" }}
                context={{ responsibleId }}
              >
                <ActionIcon
                  variant="outline"
                  onClick={() => setId(ticket.id)}
                >
                  <MdEdit />
                </ActionIcon>
              </Can>
            </Flex>
          </Paper>
        );
      },
    },
  ];

  return (
    <>
      <Box px="20px">
        <div
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            width: "100%",
          }}
        >
          <div style={{ minWidth: "3000px" }}>
            <RcTable
              rowKey="id"
              columns={rcColumn}
              data={visibleLeads}
              selectedRow={selectTicket}
              bordered
            />
          </div>
        </div>
        {!!totalLeadsPages && (
          <Flex justify="center" className="leads-table-pagination" pt="10">
            <Pagination
              totalPages={totalLeadsPages}
              currentPage={currentPage}
              onPaginationChange={onChangePagination}
            />
          </Flex>
        )}
      </Box>
      <MantineModal
        centered
        opened={!!id}
        onClose={() => setId()}
        size="lg"
        title={
          <Text size="xl" fw="bold">
            {getLanguageByKey("Editează ticketul")}
          </Text>
        }
      >
        <ManageLeadInfoTabs
          onClose={() => setId()}
          fetchLeads={fetchTickets}
          id={id}
        />
      </MantineModal>
    </>
  );
};
