import { Row, Col, Card, Statistic } from "antd";
import { ethers } from "ethers";
import { smallStatCardStyle } from "../ui/styles";

export default function StatsRow({
  minDonationWei,
  totalDonatedWei,
  contractBalWei,
  myDonatedWei,
}) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12} lg={6}>
        <Card style={smallStatCardStyle}>
          <Statistic title="Min donation (ETH)" value={ethers.formatEther(minDonationWei ?? 0n)} />
        </Card>
      </Col>

      <Col xs={24} md={12} lg={6}>
        <Card style={smallStatCardStyle}>
          <Statistic title="Total donated (ETH)" value={ethers.formatEther(totalDonatedWei ?? 0n)} />
        </Card>
      </Col>

      <Col xs={24} md={12} lg={6}>
        <Card style={smallStatCardStyle}>
          <Statistic title="Contract balance (ETH)" value={ethers.formatEther(contractBalWei ?? 0n)} />
        </Card>
      </Col>

      <Col xs={24} md={12} lg={6}>
        <Card style={smallStatCardStyle}>
          <Statistic title="My donated (ETH)" value={ethers.formatEther(myDonatedWei ?? 0n)} />
        </Card>
      </Col>
    </Row>
  );
}
