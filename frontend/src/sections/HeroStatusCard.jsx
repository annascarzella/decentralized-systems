import { Card, Divider, Space, Typography } from "antd";
import { REQUIRED_CHAIN_ID } from "../config";

const { Text, Title } = Typography;

export default function HeroStatusCard({ status, wrongNetwork }) {
  return (
    <Card
      style={{
        marginBottom: 16,
        borderRadius: 18,
        boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
        border: "1px solid rgba(255,107,107,0.18)",
        background:
          "linear-gradient(90deg, rgba(255,107,107,0.14) 0%, rgba(255,176,32,0.12) 60%, rgba(47,191,113,0.10) 100%)",
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size={8}>
        <Title level={3} style={{ margin: 0 }}>
          Give a little. Change a lot. ❤️
        </Title>
        <Text>Pick a charity below, donate in ETH, and track your impact on-chain.</Text>

        <Divider style={{ margin: "10px 0" }} />

        <Text>
          <b>Status:</b> {status}
        </Text>

        {wrongNetwork && (
          <Text type="danger">
            You are on the wrong network. Switch to chainId {REQUIRED_CHAIN_ID} in MetaMask.
          </Text>
        )}
      </Space>
    </Card>
  );
}
