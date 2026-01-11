import { Card, Space, Tag, Typography } from "antd";
import CharityGrid from "../components/CharityGrid";
import DonateModal from "../components/DonateModal";
import { cardStyle } from "../ui/styles";

const { Text } = Typography;

export default function CharitiesSection({
  charities,
  enabled,
  minDonationWei,
  donateOpen,
  setDonateOpen,
  activeCharity,
  setActiveCharity,
  donating,
  onDonate,
}) {
  return (
    <>
      <Card
        style={cardStyle}
        title={
          <Space>
            <span>Choose a charity</span>
            <Tag color="volcano">{charities.length}</Tag>
            {!enabled && <Tag>Connect on correct network</Tag>}
          </Space>
        }
      >
        <Text type="secondary">Click a charity to donate (opens a popup).</Text>

        <div style={{ marginTop: 12 }}>
          <CharityGrid
            charities={charities}
            disabled={!enabled}
            onSelectCharity={(c) => {
              setActiveCharity(c);
              setDonateOpen(true);
            }}
          />
        </div>
      </Card>

      <DonateModal
        open={donateOpen}
        onClose={() => setDonateOpen(false)}
        charity={activeCharity}
        minDonationWei={minDonationWei}
        donating={donating}
        disabled={!enabled}
        onDonate={onDonate}
      />
    </>
  );
}
