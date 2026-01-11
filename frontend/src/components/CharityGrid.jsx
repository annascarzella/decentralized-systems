import { Empty } from "antd";
import CharityCard from "./CharityCard";

export default function CharityGrid({ charities, onSelectCharity, disabled }) {
  if (!charities || charities.length === 0) {
    return <Empty description={disabled ? "Connect wallet to load charities" : "No charities available"} />;
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        overflowX: "auto",
        paddingBottom: 6,
        scrollSnapType: "x mandatory",
      }}
    >
      {charities.map((c) => (
        <div
          key={c.address}
          style={{
            minWidth: 260,
            maxWidth: 260,
            flex: "0 0 auto",
            scrollSnapAlign: "start",
          }}
        >
          <CharityCard
            charity={c}
            disabled={disabled}
            onClick={() => !disabled && onSelectCharity(c)}
          />
        </div>
      ))}
    </div>
  );
}
