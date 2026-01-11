import { Card, Typography, Tag, Space } from "antd";
import { ethers } from "ethers";
import AddressDisplay from "./AddressDisplay";

const { Text, Title } = Typography;

export default function CharityCard({ charity, onClick, disabled }) {
  const { address, name, allocatedWei } = charity;

  return (
    <Card
      hoverable={!disabled}
      onClick={onClick}
      style={{
        height: "100%",
        borderRadius: 18,
        boxShadow: "0 8px 22px rgba(0,0,0,0.06)",
        border: "1px solid rgba(255,107,107,0.14)",
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      bodyStyle={{ padding: 14 }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size={8}>
        {/* Title + CTA */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <Title level={5} style={{ margin: 0, lineHeight: 1.2 }}>
            {name || "Unnamed charity"}
          </Title>

          <Tag color="volcano" style={{ marginRight: 0 }}>
            Donate
          </Tag>
        </div>

        {/* Address (copyable, tooltip, safe click) */}
        <AddressDisplay address={address} />

        {/* Allocated amount */}
        <div style={{ marginTop: 6 }}>
          {allocatedWei != null ? (
            <Text>
              Allocated: <b>{ethers.formatEther(allocatedWei)} ETH</b>
            </Text>
          ) : (
            <Text type="secondary">Allocated: N/A</Text>
          )}
        </div>

        <Text type="secondary" style={{ fontSize: 12 }}>
          Click to donate ❤️
        </Text>
      </Space>
    </Card>
  );
}
