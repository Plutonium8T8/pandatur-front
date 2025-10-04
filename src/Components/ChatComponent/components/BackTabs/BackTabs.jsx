import { Box } from "@mantine/core";

const BackTabs = ({ palette = "green" }) => {
  // две палитры на выбор: "green" (как у тебя) и "navy" amo
  const palettes = {
    green: {
      bg3: "#f8fff8", border3: "#d0e8d0",
      bg2: "#f0f8f0", border2: "#d8e8d8",
      bg1: "#e8f0e8", border1: "#e0e8e0",
    },
    navy: {
      bg3: "#112838", border3: "#2a4a5e",
      bg2: "#0f2a3a", border2: "#35596e",
      bg1: "#0d2c3f", border1: "#3f6a82",
    },
  };
  const c = palettes[palette] ?? palettes.green;

  return (
    <>
      {/* Средняя вкладка */}
      <Box
        style={{
          position: "absolute",
          top: "-10px",
          left: "6px",
          right: "6px",
          height: "20px",
          background: c.bg2,
          border: `1px solid ${c.border2}`,
          borderBottom: "none",
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          zIndex: 2,
        }}
      />
      {/* Ближайшая вкладка */}
      <Box
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "16px",
          background: c.bg3,
          border: `1px solid ${c.border3}`,
          borderBottom: "none",
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          pointerEvents: "none",
          zIndex: 3,
        }}
      />
    </>
  );
};

export default BackTabs;
