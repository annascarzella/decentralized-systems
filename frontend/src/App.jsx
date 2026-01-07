import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import abi from "./abi.json";
import { PROXY_ADDRESS, REQUIRED_CHAIN_ID } from "./config";

import {
  Layout,
  Typography,
  Button,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Form,
  Divider,
  Table,
  Tag,
  message,
} from "antd";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function shortHex(x = "") {
  if (!x) return "-";
  return `${x.slice(0, 6)}...${x.slice(-4)}`;
}

function isSameAddr(a, b) {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

export default function App() {
  const hasMM = useMemo(() => typeof window !== "undefined" && !!window.ethereum, []);

  const [status, setStatus] = useState("Not connected");
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);

  const [owner, setOwner] = useState("");
  const [minDonationWei, setMinDonationWei] = useState(0n);
  const [totalDonatedWei, setTotalDonatedWei] = useState(0n);
  const [contractBalWei, setContractBalWei] = useState(0n);
  const [myDonatedWei, setMyDonatedWei] = useState(0n);

  const [events, setEvents] = useState([]); // {key,type,who,amountWei,txHash}

  const [donateForm] = Form.useForm();
  const [withdrawForm] = Form.useForm();

  function fmtEth(wei) {
    try {
      return ethers.formatEther(wei ?? 0n);
    } catch {
      return "0";
    }
  }

  async function getProvider() {
    if (!window.ethereum) throw new Error("MetaMask not found");
    return new ethers.BrowserProvider(window.ethereum);
  }

  async function getContractRead() {
    const provider = await getProvider();
    return new ethers.Contract(PROXY_ADDRESS, abi, provider);
  }

  async function getContractWrite() {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    return new ethers.Contract(PROXY_ADDRESS, abi, signer);
  }

  async function connect() {
    try {
      if (!hasMM) throw new Error("MetaMask not detected.");

      const provider = await getProvider();
      await provider.send("eth_requestAccounts", []);

      const net = await provider.getNetwork();
      const cid = Number(net.chainId);
      setChainId(cid);

      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setAccount(addr);

      if (cid !== REQUIRED_CHAIN_ID) {
        setStatus(`Wrong network (need ${REQUIRED_CHAIN_ID}, got ${cid})`);
        message.warning("Wrong network: switch in MetaMask then refresh.");
        return;
      }

      setStatus("Connected");
      message.success("Wallet connected");
    } catch (e) {
      const msg = e?.message ?? String(e);
      setStatus(msg);
      message.error(msg);
    }
  }

  async function refreshAll() {
    try {
      if (!account) throw new Error("Connect first.");
      if (chainId !== REQUIRED_CHAIN_ID) throw new Error("Wrong network.");

      const provider = await getProvider();
      const c = await getContractRead();

      const [o, minW, totalW, myW, balW] = await Promise.all([
        c.owner(),
        c.minDonationWei(),
        c.totalDonated(),
        c.donatedBy(account),
        provider.getBalance(PROXY_ADDRESS),
      ]);

      setOwner(o);
      setMinDonationWei(minW);
      setTotalDonatedWei(totalW);
      setMyDonatedWei(myW);
      setContractBalWei(balW);

      setStatus("Updated");
    } catch (e) {
      const msg = e?.message ?? String(e);
      setStatus(msg);
      message.error(msg);
    }
  }

  async function donate({ amountEth }) {
    try {
      if (!account) throw new Error("Connect first.");
      if (chainId !== REQUIRED_CHAIN_ID) throw new Error("Wrong network.");

      const value = ethers.parseEther(String(amountEth).trim());
      if (minDonationWei > 0n && value < minDonationWei) {
        throw new Error(`Donation too small. Min is ${fmtEth(minDonationWei)} ETH`);
      }

      const c = await getContractWrite();
      const tx = await c.donate({ value });
      message.loading({ content: "Donation sent…", key: "donate" });

      await tx.wait();
      message.success({ content: "Donation confirmed ✅", key: "donate" });

      donateForm.resetFields();
      await refreshAll();
    } catch (e) {
      const msg = e?.message ?? String(e);
      message.error(msg);
    }
  }

  async function withdraw({ to, amountEth }) {
    try {
      if (!account) throw new Error("Connect first.");
      if (chainId !== REQUIRED_CHAIN_ID) throw new Error("Wrong network.");
      if (!ethers.isAddress(to)) throw new Error("Invalid recipient address.");
      if (!isSameAddr(owner, account)) throw new Error("Only owner can withdraw.");

      const amountWei = ethers.parseEther(String(amountEth).trim());

      const c = await getContractWrite();
      const tx = await c.withdraw(to, amountWei);
      message.loading({ content: "Withdraw sent…", key: "withdraw" });

      await tx.wait();
      message.success({ content: "Withdraw confirmed ✅", key: "withdraw" });

      withdrawForm.resetFields();
      await refreshAll();
    } catch (e) {
      const msg = e?.message ?? String(e);
      message.error(msg);
    }
  }

  // Basic listeners: refresh on account/network change
  useEffect(() => {
    if (!window.ethereum) return;
    const reload = () => window.location.reload();
    window.ethereum.on("accountsChanged", reload);
    window.ethereum.on("chainChanged", reload);
    return () => {
      try {
        window.ethereum.removeListener("accountsChanged", reload);
        window.ethereum.removeListener("chainChanged", reload);
      } catch {}
    };
  }, []);

  // Auto-refresh once connected on correct chain
  useEffect(() => {
    if (account && chainId === REQUIRED_CHAIN_ID) refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, chainId]);

  // Event listeners (keep last 10)
  useEffect(() => {
    if (!account || chainId !== REQUIRED_CHAIN_ID) return;

    let contract;
    let active = true;

    (async () => {
      try {
        contract = await getContractRead();

        const onDonated = (donor, amountWei, ev) => {
          if (!active) return;
          const txHash = ev?.log?.transactionHash ?? ev?.transactionHash ?? "";
          setEvents((prev) =>
            [{ key: `${txHash}-d`, type: "Donated", who: donor, amountWei, txHash }, ...prev].slice(0, 10)
          );
        };

        const onWithdrawn = (to, amountWei, ev) => {
          if (!active) return;
          const txHash = ev?.log?.transactionHash ?? ev?.transactionHash ?? "";
          setEvents((prev) =>
            [{ key: `${txHash}-w`, type: "Withdrawn", who: to, amountWei, txHash }, ...prev].slice(0, 10)
          );
        };

        contract.on("Donated", onDonated);
        contract.on("Withdrawn", onWithdrawn);

        return () => {
          try {
            contract.off("Donated", onDonated);
            contract.off("Withdrawn", onWithdrawn);
          } catch {}
        };
      } catch {
        // ignore
      }
    })();

    return () => {
      active = false;
      try {
        if (contract) contract.removeAllListeners();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, chainId]);

  const wrongNetwork = chainId !== null && chainId !== REQUIRED_CHAIN_ID;
  const isOwner = isSameAddr(owner, account);

  const columns = [
    {
      title: "Type",
      dataIndex: "type",
      render: (t) => (t === "Donated" ? <Tag color="green">Donated</Tag> : <Tag color="gold">Withdrawn</Tag>),
    },
    { title: "Who", dataIndex: "who", render: (x) => <Text code>{shortHex(x)}</Text> },
    { title: "Amount (ETH)", dataIndex: "amountWei", render: (w) => fmtEth(w) },
    { title: "Tx", dataIndex: "txHash", render: (x) => <Text code>{shortHex(x)}</Text> },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
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
            DonationPlatformV1
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.75)" }}>
            Proxy: {shortHex(PROXY_ADDRESS)} • Chain: {chainId ?? "-"}
          </Text>
        </Space>

        <Space>
          <Button onClick={refreshAll} disabled={!account || wrongNetwork}>
            Refresh
          </Button>
          <Button type="primary" onClick={connect}>
            {account ? `Connected: ${shortHex(account)}` : "Connect MetaMask"}
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: 24, maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        {!hasMM && (
          <Card>
            <Text>MetaMask not detected. Install it and refresh.</Text>
          </Card>
        )}

        {hasMM && (
          <>
            <Card style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: "100%" }}>
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

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} lg={6}>
                <Card>
                  <Statistic title="Min donation (ETH)" value={fmtEth(minDonationWei)} />
                </Card>
              </Col>
              <Col xs={24} md={12} lg={6}>
                <Card>
                  <Statistic title="Total donated (ETH)" value={fmtEth(totalDonatedWei)} />
                </Card>
              </Col>
              <Col xs={24} md={12} lg={6}>
                <Card>
                  <Statistic title="Contract balance (ETH)" value={fmtEth(contractBalWei)} />
                </Card>
              </Col>
              <Col xs={24} md={12} lg={6}>
                <Card>
                  <Statistic title="My donated (ETH)" value={fmtEth(myDonatedWei)} />
                </Card>
              </Col>
            </Row>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="Donate">
                  <Form form={donateForm} layout="vertical" onFinish={donate}>
                    <Form.Item
                      label={`Amount in ETH (min ${fmtEth(minDonationWei)} ETH)`}
                      name="amountEth"
                      rules={[{ required: true, message: "Enter an amount" }]}
                    >
                      <Input placeholder="0.001" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" disabled={!account || wrongNetwork}>
                      Donate
                    </Button>
                  </Form>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card
                  title={
                    <Space>
                      Withdraw (owner only)
                      {isOwner ? <Tag color="blue">You are owner</Tag> : <Tag>Not owner</Tag>}
                    </Space>
                  }
                >
                  <Form form={withdrawForm} layout="vertical" onFinish={withdraw}>
                    <Form.Item
                      label="Recipient address"
                      name="to"
                      rules={[
                        { required: true, message: "Enter a recipient address" },
                        {
                          validator: (_, v) =>
                            !v || ethers.isAddress(v) ? Promise.resolve() : Promise.reject(new Error("Invalid address")),
                        },
                      ]}
                    >
                      <Input placeholder="0x..." />
                    </Form.Item>

                    <Form.Item
                      label="Amount in ETH"
                      name="amountEth"
                      rules={[{ required: true, message: "Enter an amount" }]}
                    >
                      <Input placeholder="0.01" />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" disabled={!account || wrongNetwork || !isOwner}>
                      Withdraw
                    </Button>
                  </Form>
                </Card>
              </Col>
            </Row>

            <Divider />

            <Card
              title={
                <Space>
                  Recent events
                  <Text type="secondary">(last {events.length})</Text>
                </Space>
              }
            >
              <Table
                columns={columns}
                dataSource={events}
                pagination={false}
                locale={{ emptyText: "No events yet (donate/withdraw to see updates)" }}
              />
              <Divider style={{ margin: "12px 0" }} />
              <Text type="secondary">
                Owner: <Text code>{shortHex(owner)}</Text>
              </Text>
            </Card>
          </>
        )}
      </Content>
    </Layout>
  );
}
