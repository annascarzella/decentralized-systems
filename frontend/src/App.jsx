import { Layout, Card, Row, Col, Statistic, Divider, Typography, Space, Tag, Table } from "antd";
import { ethers } from "ethers";
import { PROXY_ADDRESS, REQUIRED_CHAIN_ID } from "./config";

import { useWallet } from "./hooks/useWallet";
import { useDonationContract } from "./hooks/useDonationContract";
import { HeaderBar } from "./components/HeaderBar";
import { CharityDonateCard } from "./components/CharityDonateCard";

const { Content } = Layout;
const { Text } = Typography;

function shortHex(x = "") {
  if (!x) return "-";
  return `${x.slice(0, 6)}...${x.slice(-4)}`;
}

export default function App() {
  const { hasMM, account, chainId, status, wrongNetwork, connect, getProvider } = useWallet();

  const enabled = !!account && chainId === REQUIRED_CHAIN_ID;

  const {
    owner, minDonationWei, totalDonatedWei, contractBalWei, myDonatedWei, isOwner,
    charities, selectedCharity, setSelectedCharity,
    refreshAll,
    donateToCharity,
  } = useDonationContract({ getProvider, account, enabled });

  const columns = [
    { title: "Charity", dataIndex: "name" },
    { title: "Address", dataIndex: "address", render: (a) => <Text code>{shortHex(a)}</Text> },
    {
      title: "Allocated (ETH)",
      dataIndex: "allocatedWei",
      render: (w) => (w === null ? <Text type="secondary">n/a</Text> : ethers.formatEther(w)),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <HeaderBar
        proxyAddress={PROXY_ADDRESS}
        chainId={chainId}
        account={account}
        onConnect={connect}
        onRefresh={refreshAll}
        refreshDisabled={!enabled}
      />

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
                <Text><b>Status:</b> {status}</Text>
                {wrongNetwork && (
                  <Text type="danger">
                    You are on the wrong network. Switch to chainId {REQUIRED_CHAIN_ID} in MetaMask.
                  </Text>
                )}
              </Space>
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} lg={6}>
                <Card><Statistic title="Min donation (ETH)" value={ethers.formatEther(minDonationWei ?? 0n)} /></Card>
              </Col>
              <Col xs={24} md={12} lg={6}>
                <Card><Statistic title="Total donated (ETH)" value={ethers.formatEther(totalDonatedWei ?? 0n)} /></Card>
              </Col>
              <Col xs={24} md={12} lg={6}>
                <Card><Statistic title="Contract balance (ETH)" value={ethers.formatEther(contractBalWei ?? 0n)} /></Card>
              </Col>
              <Col xs={24} md={12} lg={6}>
                <Card><Statistic title="My donated (ETH)" value={ethers.formatEther(myDonatedWei ?? 0n)} /></Card>
              </Col>
            </Row>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <CharityDonateCard
                  charities={charities}
                  selectedCharity={selectedCharity}
                  setSelectedCharity={setSelectedCharity}
                  minDonationWei={minDonationWei}
                  disabled={!enabled}
                  onDonate={donateToCharity}
                />
              </Col>

              <Col xs={24} lg={12}>
                <Card
                  title={
                    <Space>
                      Owner
                      {isOwner ? <Tag color="blue">You are owner</Tag> : <Tag>Not owner</Tag>}
                    </Space>
                  }
                >
                  <Text>
                    Current owner: <Text code>{shortHex(owner)}</Text>
                  </Text>
                  <Divider style={{ margin: "12px 0" }} />
                  <Text type="secondary">
                    (Owner withdraw UI can stay in a separate card if you still want it — I removed it here to keep
                    this step focused on charities/donations.)
                  </Text>
                </Card>
              </Col>
            </Row>

            <Divider />

            <Card
              title={
                <Space>
                  Available charities
                  <Text type="secondary">({charities.length})</Text>
                </Space>
              }
            >
              <Table
                columns={columns}
                dataSource={charities.map((c) => ({ key: c.address, ...c }))}
                pagination={false}
                locale={{ emptyText: enabled ? "No charities registered yet" : "Connect on correct network to load" }}
              />
            </Card>
          </>
        )}
      </Content>
    </Layout>
  );
}
