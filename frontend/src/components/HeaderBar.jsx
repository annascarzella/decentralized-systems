import { Layout, Typography, Space, Button } from "antd";

const { Header } = Layout;
const { Title, Text } = Typography;

function shortHex(x = "") {
  if (!x) return "-";
  return `${x.slice(0, 6)}...${x.slice(-4)}`;
}

export function HeaderBar({ proxyAddress, chainId, account, onConnect, onRefresh, refreshDisabled }) {
  return (
    <Header
      style={{
        height: "auto",
        lineHeight: "normal",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <Space direction="vertical" size={0}>
        <Title level={4} style={{ color: "white", margin: 0 }}>
          DonationPlatform
        </Title>
        <Text style={{ color: "rgba(255,255,255,0.75)" }}>
          Proxy: {shortHex(proxyAddress)} • Chain: {chainId ?? "-"}
        </Text>
      </Space>

      <Space>
        <Button onClick={onRefresh} disabled={refreshDisabled}>
          Refresh
        </Button>
        <Button type="primary" onClick={onConnect}>
          {account ? `Connected: ${shortHex(account)}` : "Connect MetaMask"}
        </Button>
      </Space>
    </Header>
  );
}
