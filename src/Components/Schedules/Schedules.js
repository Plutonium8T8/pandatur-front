import React, { useState } from "react";
import { Button } from "@mantine/core";
import { IoMdAdd } from "react-icons/io";
import SchedulesList from "./SchedulesGroupList";
import { translations } from "../utils/translations";
import ModalGroup from "./ModalGroup";
import { PageHeader } from "../PageHeader";

const language = localStorage.getItem("language") || "RO";

const Schedules = () => {
  const [opened, setOpened] = useState(false);
  const [reload, setReload] = useState(false);
  const [inGroupView, setInGroupView] = useState(false);

  return (
    <div style={{ padding: "20px" }}>
      {!inGroupView && (
        <PageHeader
          title={translations["Orar"][language]}
          extraInfo={
            <Button
              leftSection={<IoMdAdd size={16} />}
              ml="auto"
              onClick={() => setOpened(true)}
            >
              {translations["Adaugă grup"][language]}
            </Button>
          }
        />
      )}

      <SchedulesList reload={reload} setInGroupView={setInGroupView} />

      <ModalGroup
        opened={opened}
        onClose={() => setOpened(false)}
        onGroupCreated={() => {
          setOpened(false);
          setReload((r) => !r);
        }}
      />
    </div>
  );
};

export default Schedules;
