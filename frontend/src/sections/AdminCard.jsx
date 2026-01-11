import { Card, Divider, Space, Tag, Typography } from "antd";
import { cardStyle } from "../ui/styles";

const { Text } = Typography;

function shortHex(x = "") {
  if (!x) return "-";
  return `${x.slice(0, 6)}...${x.slice(-4)}`;
}

export default function AdminCard({ owner, isOwner }) {
  return (
    <Card
      style={cardStyle}
      title={
        <Space>
          Owner
          {isOwner ? <Tag color="blue">You are owner</Tag> : <Tag>Not owner</Tag>}
        </Space>
      }
    >
      <Text>
        Contract owner: <Text code>{shortHex(owner)}</Text>
      </Text>

      <Divider style={{ margin: "12px 0" }} />

      <Text type="secondary">
        Administrative actions (withdraw, management) can live here.
      </Text>
    </Card>
  );
}
