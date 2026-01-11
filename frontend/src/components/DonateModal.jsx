import { Modal, Form, Input, Typography, Space, Button } from "antd";
import { ethers } from "ethers";
import { useEffect } from "react";
import AddressDisplay from "./AddressDisplay";

const { Text, Title } = Typography;

export default function DonateModal({
  open,
  onClose,
  charity,
  minDonationWei,
  onDonate,
  donating,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) form.resetFields();
  }, [open, form]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title="Donate"
      destroyOnClose
    >
      {!charity ? (
        <Text type="secondary">No charity selected.</Text>
      ) : (
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {/* Charity info */}
          <div>
            <Title level={5} style={{ margin: 0 }}>
              {charity.name || "Unnamed charity"}
            </Title>

            {/* Full / copyable address */}
            <AddressDisplay address={charity.address} />
          </div>

          <Text type="secondary">
            Min donation: {ethers.formatEther(minDonationWei ?? 0n)} ETH
          </Text>

          {/* Donation form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={async (vals) => {
              await onDonate({ amountEth: vals.amountEth });
              form.resetFields();
            }}
          >
            <Form.Item
              label="Amount in ETH"
              name="amountEth"
              rules={[
                { required: true, message: "Enter an amount" },
                {
                  validator: async (_, v) => {
                    const s = String(v ?? "").trim();
                    if (!s) return;

                    if (!/^\d+(\.\d+)?$/.test(s)) {
                      throw new Error("Enter a valid number (e.g. 0.01)");
                    }

                    const wei = ethers.parseEther(s);
                    if (wei <= 0n) throw new Error("Amount must be > 0");

                    if (minDonationWei > 0n && wei < minDonationWei) {
                      throw new Error(
                        `Min is ${ethers.formatEther(minDonationWei)} ETH`
                      );
                    }
                  },
                },
              ]}
            >
              <Input inputMode="decimal" placeholder="0.001" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={donating}
              disabled={donating}
              block
            >
              Donate
            </Button>
          </Form>
        </Space>
      )}
    </Modal>
  );
}
