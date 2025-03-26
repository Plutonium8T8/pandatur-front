import { TextInput, Title, Box, NumberInput, Button, Flex } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useEffect } from "react"
import { getLanguageByKey } from "../../utils"

export const PersonalDataForm = ({ loading, onSubmit, data }) => {
  const form = useForm({
    mode: "uncontrolled"
  })

  useEffect(() => {
    if (data) {
      form.setValues({
        name: data.name,
        surname: data.surname,
        phone: data.phone
      })
    }
  }, [data])

  return (
    <Box>
      <Title order={3}>{getLanguageByKey("Date personale")}</Title>
      <form
        onSubmit={form.onSubmit((values) =>
          onSubmit(values, () => form.reset())
        )}
      >
        <TextInput
          mt="md"
          label={getLanguageByKey("Nume")}
          placeholder={getLanguageByKey("Nume")}
          key={form.key("name")}
          {...form.getInputProps("name")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Prenume")}
          placeholder={getLanguageByKey("Prenume")}
          key={form.key("surname")}
          {...form.getInputProps("surname")}
        />

        <NumberInput
          hideControls
          mt="md"
          label={getLanguageByKey("Telefon")}
          placeholder={getLanguageByKey("Telefon")}
          key={form.key("phone")}
          {...form.getInputProps("phone")}
        />

        <Flex justify="end">
          <Button type="submit" mt="md" loading={loading}>
            {getLanguageByKey("Salvați datele personale")}
          </Button>
        </Flex>
      </form>
    </Box>
  )
}
