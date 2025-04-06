import { Combobox, useCombobox } from "@mantine/core";

export const ComboSelect = ({
  data,
  onChange,
  renderTargetButton,
  maxHeight = 200,
  width = 250,
}) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const options = data.map(({ value, label }) => (
    <Combobox.Option value={value} key={value}>
      {label}
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      width={width}
      onOptionSubmit={(val) => {
        onChange(val);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        {renderTargetButton(combobox.toggleDropdown)}
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options mah={maxHeight} style={{ overflowY: "auto" }}>
          {options}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};
