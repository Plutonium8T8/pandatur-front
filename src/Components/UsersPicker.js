// Components/UsersPicker.jsx
import { useMemo, useState } from "react";
import {
    Combobox,
    useCombobox,
    TextInput,
    ScrollArea,
    Checkbox,
    Badge,
    Text,
    ActionIcon,
} from "@mantine/core";
import { IoClose } from "react-icons/io5";
import { getLanguageByKey } from "./utils";

const GROUP_PREFIX = "__group__";
const fromGroupKey = (key) =>
    key?.startsWith(GROUP_PREFIX) ? key.slice(GROUP_PREFIX.length) : key;

/** стабильный цвет по названию группы */
const useGroupColor = () => {
    const families = [
        "blue",
        "grape",
        "green",
        "indigo",
        "orange",
        "pink",
        "cyan",
        "teal",
        "violet",
        "lime",
        "red",
        "yellow",
    ];
    return (name = "") => {
        let h = 0;
        for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
        return families[h % families.length];
    };
};

/** вернуть список чистых названий групп для пользователя по карте групп */
const getUserGroups = (userId, groupUserMap) => {
    const res = [];
    for (const [gKey, users] of groupUserMap.entries()) {
        if (gKey?.startsWith(GROUP_PREFIX) && users?.includes(userId)) {
            res.push(fromGroupKey(gKey));
        }
    }
    return Array.from(new Set(res));
};

/**
 * UsersPicker
 * props:
 * - data: [{ value, label }] (включая опционально элементы-группы с value="__group__<name>")
 * - value: string[] — выбранные userId
 * - onChange: (ids: string[]) => void
 * - groupUserMap: Map("__group__<name>" => userId[])
 * - placeholder, nothingFoundMessage, disabled, maxDropdownHeight, width
 */
const UsersPicker = ({
    data = [],
    value = [],
    onChange,
    groupUserMap,
    placeholder,
    nothingFoundMessage,
    disabled,
    maxDropdownHeight = 300,
    width = 360,
}) => {
    const control = useCombobox({
        onDropdownClose: () => control.resetSelectedOption(),
        onDropdownOpen: () => control.updateSelectedOptionIndex("active"),
    });

    const [search, setSearch] = useState("");
    const colorOf = useGroupColor();

    const userOptions = useMemo(
        () => (data || []).filter((o) => !String(o.value).startsWith(GROUP_PREFIX)),
        [data]
    );
    const groupOptions = useMemo(
        () => (data || []).filter((o) => String(o.value).startsWith(GROUP_PREFIX)),
        [data]
    );

    const filteredUsers = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return userOptions;
        return userOptions.filter((u) => u.label?.toLowerCase().includes(q));
    }, [search, userOptions]);

    const selectUser = (userId) => {
        const exists = value.includes(userId);
        const next = exists ? value.filter((v) => v !== userId) : [...value, userId];
        onChange?.(next);
    };

    const selectGroup = (gKey) => {
        const users = groupUserMap.get(gKey) || [];
        const next = Array.from(new Set([...value, ...users]));
        onChange?.(next);
    };

    const clearAll = () => onChange?.([]);

    return (
        <Combobox store={control} withinPortal={false} disabled={disabled}>
            <Combobox.Target>
                <div style={{ width, display: "flex", gap: 8, alignItems: "center" }}>
                    <TextInput
                        style={{ flex: 1 }}
                        value={search}
                        onChange={(e) => {
                            setSearch(e.currentTarget.value);
                            control.openDropdown();
                            control.updateSelectedOptionIndex();
                        }}
                        placeholder={placeholder}
                        onFocus={() => control.openDropdown()}
                    />
                    {value?.length ? (
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            aria-label="Clear"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={clearAll}
                        >
                            <IoClose />
                        </ActionIcon>
                    ) : null}
                </div>
            </Combobox.Target>

            <Combobox.Dropdown>
                {/* ГРУППЫ */}
                <Combobox.Header p="xs">
                    <Text size="xs" fw={600}>
                        {getLanguageByKey("Groups")}
                    </Text>
                </Combobox.Header>

                <div style={{ padding: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {groupOptions.length ? (
                        groupOptions.map((g) => {
                            const name = fromGroupKey(g.value);
                            return (
                                <Badge
                                    key={g.value}
                                    variant="light"
                                    color={colorOf(name)}
                                    style={{ cursor: "pointer" }}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => selectGroup(g.value)}
                                    title={getLanguageByKey("Selectează toți din grup")}
                                >
                                    {name}
                                </Badge>
                            );
                        })
                    ) : (
                        <Text size="xs" c="dimmed">
                            {getLanguageByKey("Nu sunt grupuri")}
                        </Text>
                    )}
                </div>

                {/* ПОЛЬЗОВАТЕЛИ */}
                <Combobox.Header p="xs">
                    <Text size="xs" fw={600}>
                        {getLanguageByKey("Users")}
                    </Text>
                </Combobox.Header>

                <Combobox.Options>
                    <ScrollArea style={{ maxHeight: maxDropdownHeight }}>
                        {filteredUsers.length === 0 ? (
                            <Combobox.Empty>{nothingFoundMessage}</Combobox.Empty>
                        ) : (
                            filteredUsers.map((item) => {
                                const checked = value.includes(item.value);
                                const uGroups = getUserGroups(item.value, groupUserMap);
                                return (
                                    <Combobox.Option
                                        value={String(item.value)}
                                        key={item.value}
                                        active={checked}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => selectUser(item.value)}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <Checkbox checked={checked} readOnly tabIndex={-1} aria-hidden />
                                                <Text>{item.label}</Text>
                                            </div>
                                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                {uGroups.map((g) => (
                                                    <Badge key={g} size="xs" variant="light" color={colorOf(g)}>
                                                        {g}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </Combobox.Option>
                                );
                            })
                        )}
                    </ScrollArea>
                </Combobox.Options>

                {/* ВЫБРАНО */}
                {!!value?.length && (
                    <>
                        <Combobox.Header p="xs">
                            <Text size="xs" fw={600}>
                                {getLanguageByKey("Selected")}
                            </Text>
                        </Combobox.Header>
                        <div style={{ padding: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {value.map((v) => {
                                const item = userOptions.find((u) => u.value === v);
                                if (!item) return null;
                                const uGroups = getUserGroups(v, groupUserMap);
                                return (
                                    <Badge
                                        key={v}
                                        variant="outline"
                                        rightSection={
                                            <ActionIcon
                                                size="xs"
                                                variant="subtle"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => selectUser(v)}
                                            >
                                                <IoClose />
                                            </ActionIcon>
                                        }
                                    >
                                        {item.label}
                                        {uGroups.slice(0, 2).map((g) => (
                                            <Badge
                                                key={g}
                                                size="xs"
                                                variant="light"
                                                color={colorOf(g)}
                                                style={{ marginLeft: 6 }}
                                            >
                                                {g}
                                            </Badge>
                                        ))}
                                        {uGroups.length > 2 && (
                                            <Badge size="xs" variant="outline" style={{ marginLeft: 6 }}>
                                                +{uGroups.length - 2}
                                            </Badge>
                                        )}
                                    </Badge>
                                );
                            })}
                        </div>
                    </>
                )}
            </Combobox.Dropdown>
        </Combobox>
    );
};

export default UsersPicker;
