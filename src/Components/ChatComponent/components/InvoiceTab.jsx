import { Select, Button, Flex } from "@mantine/core";
import { useState } from "react";
import { getLanguageByKey } from "@utils";
import { InvoiceForm } from "../../TicketForms/InvoiceForm";

export const InvoiceTab = ({ extraInfo, onSaveTicketExtraDate, loading }) => {
  const [selectedValue, setSelectedValue] = useState();

  return (
    <div>
      <Select
        mb="md"
        onChange={(value) => {
          setSelectedValue(value);
          // if (value === "cont_spre_plată") {
          //   setSelectedValue(value);
          // } else {
          //   setSelectedValue(undefined);
          // }
        }}
        data={[
          {
            value: "cont-spre-plată",
            label: getLanguageByKey("accountForPayment"),
          },
          {
            value: "cerere-de-return",
            label: getLanguageByKey("returnRequest"),
          },
          {
            value: "join-up-guarantee-letter",
            label: getLanguageByKey("joinUpGuaranteeLetter"),
          },
        ]}
        placeholder={getLanguageByKey("selectInvoiceType")}
      />

      {selectedValue === "cont-spre-plată" ? (
        <InvoiceForm
          data={extraInfo}
          onSubmit={onSaveTicketExtraDate}
          renderFooterButtons={({ formId }) => (
            <Button loading={loading} type="submit" form={formId}>
              {getLanguageByKey("generate")}
            </Button>
          )}
        />
      ) : (
        <Flex justify="end">
          <Button
            onClick={() => onSaveTicketExtraDate(selectedValue)}
            disabled={!selectedValue}
            loading={loading}
          >
            {getLanguageByKey("generate")}
          </Button>
        </Flex>
      )}
    </div>
  );
};
