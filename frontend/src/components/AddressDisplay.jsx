import { Typography, Tooltip, Button, Space, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";

const { Text } = Typography;

function shortHex(x = "") {
  if (!x) return "-";
  return `${x.slice(0, 6)}...${x.slice(-4)}`;
}

export default function AddressDisplay({ address }) {
  if (!address) return <Text>-</Text>;

  const copy = async (e) => {
    e?.stopPropagation?.();
    try {
      await navigator.clipboard.writeText(address);
      message.success("Address copied");
    } catch {
      // fallback if clipboard permission is blocked
      const ta = document.createElement("textarea");
      ta.value = address;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      message.success("Address copied");
    }
  };

  return (
    <span
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ display: "inline-flex", alignItems: "center" }}
    >
      <Space size={8}>
        <Tooltip title={address}>
          <Text style={{ cursor: "default" }}>{shortHex(address)}</Text>
        </Tooltip>

        <Button
          size="small"
          icon={<CopyOutlined />}
          onClick={copy}
          type="default"
        >
          Copy
        </Button>
      </Space>
    </span>
  );
}
