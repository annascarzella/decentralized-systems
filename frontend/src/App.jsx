import { Layout, ConfigProvider, Card, Divider, Typography } from "antd";
import { PROXY_ADDRESS, REQUIRED_CHAIN_ID } from "./config";

import { useWallet } from "./hooks/useWallet";
import { useDonationContract } from "./hooks/useDonationContract";
import { HeaderBar } from "./components/HeaderBar";

import { useState } from "react";
import { theme } from "./ui/theme";
import { pageBgStyle, contentStyle } from "./ui/styles";

import HeroStatusCard from "./sections/HeroStatusCard";
import StatsRow from "./sections/StatsRow";
import CharitiesSection from "./sections/CharitiesSection";
import AdminCard from "./sections/AdminCard";

const { Content } = Layout;
const { Text, Title } = Typography;

export default function App() {
  const { hasMM, account, chainId, status, wrongNetwork, connect, getProvider } = useWallet();
  const enabled = !!account && chainId === REQUIRED_CHAIN_ID;

  const {
    owner,
    minDonationWei,
    totalDonatedWei,
    contractBalWei,
    myDonatedWei,
    isOwner,
    charities,
    refreshAll,
    donateToCharity,
  } = useDonationContract({ getProvider, account, enabled });

  const [donateOpen, setDonateOpen] = useState(false);
  const [activeCharity, setActiveCharity] = useState(null);
  const [donating, setDonating] = useState(false);

  return (
    <ConfigProvider theme={theme}>
      <Layout style={pageBgStyle}>
        <HeaderBar
          proxyAddress={PROXY_ADDRESS}
          chainId={chainId}
          account={account}
          onConnect={connect}
          onRefresh={refreshAll}
          refreshDisabled={!enabled}
        />

        <Content style={contentStyle}>
          {!hasMM && (
            <Card style={{ borderRadius: 18 }}>
              <Title level={4} style={{ marginTop: 0 }}>
                Wallet required
              </Title>
              <Text>MetaMask not detected. Install it and refresh.</Text>
            </Card>
          )}

          {hasMM && (
            <>
              <HeroStatusCard status={status} wrongNetwork={wrongNetwork} />

              <Divider />

              <CharitiesSection
                charities={charities}
                enabled={enabled}
                minDonationWei={minDonationWei}
                donateOpen={donateOpen}
                setDonateOpen={setDonateOpen}
                activeCharity={activeCharity}
                setActiveCharity={setActiveCharity}
                donating={donating}
                onDonate={async ({ amountEth }) => {
                  if (!activeCharity) return;
                  setDonating(true);
                  try {
                    await donateToCharity({ charity: activeCharity.address, amountEth });
                    setDonateOpen(false);
                  } finally {
                    setDonating(false);
                  }
                }}
              />

              <Divider />

              <StatsRow
                minDonationWei={minDonationWei}
                totalDonatedWei={totalDonatedWei}
                contractBalWei={contractBalWei}
                myDonatedWei={myDonatedWei}
              />

              <Divider />

              <AdminCard owner={owner} isOwner={isOwner} />
            </>
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
