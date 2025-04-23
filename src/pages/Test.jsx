import { useState } from "react";
import { RcTable, HeaderCellRcTable } from "../Components/RcTable";
import { Checkbox } from "../Components/Checkbox";

export const Test = () => {
  const [order, setOrder] = useState("ASC");
  const [selectedRow, setSelectedRow] = useState([]);
  const [, setColumn] = useState("");

  const columns = [
    {
      width: 100,
      key: "checkbox",
      align: "center",
      render: (row) => {
        return (
          <Checkbox
            checked={selectedRow.includes(row.id)}
            onChange={() => {
              setSelectedRow((prev) =>
                prev.includes(row.id)
                  ? prev.filter((id) => id !== row.id)
                  : [...prev, row.id],
              );
            }}
          />
        );
      },
    },
    {
      title: <HeaderCellRcTable title="Title" order={order} />,
      dataIndex: "name",
      key: "name",
      width: 100,
      align: "center",
      onHeaderCell: () => {
        return {
          onClick: () => {
            setColumn("name");
            setOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
          },
        };
      },
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
      width: 100,
      align: "center",
    },

    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      width: 200,
      align: "center",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 250,
      align: "center",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      width: 180,
      align: "center",
    },
    {
      title: "Job",
      dataIndex: "job",
      key: "job",
      width: 200,
      align: "center",
    },
    {
      title: "Company",
      dataIndex: "company",
      key: "company",
      width: 200,
      align: "center",
    },
    {
      title: "Hobbies",
      dataIndex: "hobbies",
      key: "hobbies",
      width: 650,
      align: "center",
      render: (hobbies) => hobbies.join(", "), // Afișează ca listă separată prin virgulă
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 350,
      align: "center",
    },
    {
      title: "Registered At",
      dataIndex: "registeredAt",
      key: "registeredAt",
      width: 500,
      align: "center",
      render: (date) => new Date(date).toLocaleDateString(), // Formatare frumoasă a datei
    },
  ];

  const data = [
    {
      id: "1",
      name: "Jack",
      age: 28,
      address: "New York, USA",
      email: "jack@example.com",
      phone: "+123456789",
      job: "Software Engineer",
      company: "TechCorp",
      hobbies: ["Reading", "Gaming", "Hiking"],
      status: "Active",
      registeredAt: "2022-05-10T12:34:56Z",
    },
    {
      id: "2",
      name: "Emily",
      age: 25,
      address: "London, UK",
      email: "emily@example.com",
      phone: "+44123456789",
      job: "Product Manager",
      company: "Innovate Ltd",
      hobbies: ["Cooking", "Traveling", "Photography"],
      status: "Active",
      registeredAt: "2021-09-15T10:20:30Z",
    },
    {
      id: "3",
      name: "Michael",
      age: 35,
      address: "Berlin, Germany",
      email: "michael@example.com",
      phone: "+49123456789",
      job: "UX Designer",
      company: "DesignHub",
      hobbies: ["Drawing", "Biking", "Chess"],
      status: "Inactive",
      registeredAt: "2020-07-22T08:45:12Z",
    },
    {
      id: "4",
      name: "Sophia",
      age: 30,
      address: "Paris, France",
      email: "sophia@example.com",
      phone: "+33123456789",
      job: "Data Scientist",
      company: "AI Solutions",
      hobbies: ["AI Research", "Piano", "Running"],
      status: "Active",
      registeredAt: "2019-11-03T14:10:05Z",
    },
    {
      id: "565",
      name: "Daniel",
      age: 40,
      address: "Tokyo, Japan",
      email: "daniel@example.com",
      phone: "+81123456789",
      job: "CTO",
      company: "FutureTech",
      hobbies: ["Investing", "Reading", "Golf"],
      status: "Active",
      registeredAt: "2018-06-29T16:30:50Z",
    },
  ];

  return (
    <div style={{ margin: "10px" }}>
      <RcTable
        rowKey={({ id }) => id}
        columns={columns}
        data={data}
        pagination={{ position: "center" }}
        selectedRow={selectedRow}
        loading={false}
        bordered
      />
    </div>
  );
};
