import { Card, Form, Input, Button, Select, Space, Typography } from "antd";
import { ethers } from "ethers";

const { Text } = Typography;

export function CharityDonateCard({
  charities,
  selectedCharity,
  setSelectedCharity,
  minDonationWei,
  disabled,
  onDonate,
}) {
  const [form] = Form.useForm();

  const options = charities.map((c) => ({
    value: c.address,
    label: `${c.name} (${c.address.slice(0, 6)}...${c.address.slice(-4)})`,
  }));

  return (
    <Card title="Donate to a charity">
      <Form
        form={form}
        layout="vertical"
        onFinish={async (vals) => {
          await onDonate({ charity: vals.charity, amountEth: vals.amountEth });
          form.resetFields(["amountEth"]);
        }}
        initialValues={{ charity: selectedCharity || (options[0]?.value ?? "") }}
      >
        <Form.Item label="Charity" name="charity" rules={[{ required: true, message: "Select a charity" }]}>
          <Select
            options={options}
            value={selectedCharity}
            onChange={(v) => setSelectedCharity(v)}
            placeholder="Select charity"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Space direction="vertical" style={{ width: "100%" }} size={0}>
          <Text type="secondary">
            Min donation: {ethers.formatEther(minDonationWei ?? 0n)} ETH
          </Text>
        </Space>

        <Form.Item
          label="Amount in ETH"
          name="amountEth"
          rules={[{ required: true, message: "Enter an amount" }]}
        >
          <Input placeholder="0.001" />
        </Form.Item>

        <Button type="primary" htmlType="submit" disabled={disabled || !selectedCharity}>
          Donate
        </Button>
      </Form>
    </Card>
  );
}
