import { useState } from "react";
import { Paper, Flex, Textarea, Button } from "@mantine/core";
import { getLanguageByKey } from "@utils";

export const InlineNoteComposer = ({ onCancel, onSave, loading }) => {
    const [text, setText] = useState("");
    return (
        <Paper p="12" radius="md" withBorder style={{ background: "#fffef7" }}>
            <Flex direction="column" gap="8">
                <Textarea
                    placeholder={getLanguageByKey("Напишите заметку…")}
                    autosize
                    minRows={3}
                    maxRows={8}
                    value={text}
                    onChange={(e) => setText(e.currentTarget.value)}
                />
                <Flex gap="8" justify="flex-end">
                    <Button variant="subtle" color="gray" onClick={onCancel}>
                        {getLanguageByKey("Отмена")}
                    </Button>
                    <Button onClick={() => onSave(text.trim())} disabled={!text.trim() || loading}>
                        {getLanguageByKey("Сохранить")}
                    </Button>
                </Flex>
            </Flex>
        </Paper>
    );
};
