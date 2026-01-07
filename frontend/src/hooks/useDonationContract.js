import { useCallback, useMemo, useState } from "react";
import { ethers } from "ethers";
import abi from "../abi.json";
import { PROXY_ADDRESS } from "../config";
import { message } from "antd";

function shortHex(x = "") {
  if (!x) return "-";
  return `${x.slice(0, 6)}...${x.slice(-4)}`;
}

function safeLower(x) {
  return (x ?? "").toLowerCase();
}

export function useDonationContract({ getProvider, account, enabled }) {
  const [owner, setOwner] = useState("");
  const [minDonationWei, setMinDonationWei] = useState(0n);
  const [totalDonatedWei, setTotalDonatedWei] = useState(0n);
  const [contractBalWei, setContractBalWei] = useState(0n);
  const [myDonatedWei, setMyDonatedWei] = useState(0n);

  // Charities
  const [charities, setCharities] = useState([]); // [{address, name, allocatedWei}]
  const [selectedCharity, setSelectedCharity] = useState("");

  const isOwner = useMemo(() => safeLower(owner) === safeLower(account) && !!owner, [owner, account]);

  async function getReadContract() {
    const provider = await getProvider();
    return new ethers.Contract(PROXY_ADDRESS, abi, provider);
  }

  async function getWriteContract() {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    return new ethers.Contract(PROXY_ADDRESS, abi, signer);
  }

  const refreshCore = useCallback(async () => {
    if (!enabled) return;
    const provider = await getProvider();
    const c = await getReadContract();

    const [o, minW, totalW, myW, balW] = await Promise.all([
      c.owner(),
      c.minDonationWei(),
      c.totalDonated(),
      account ? c.donatedBy(account) : 0n,
      provider.getBalance(PROXY_ADDRESS),
    ]);

    setOwner(o);
    setMinDonationWei(minW);
    setTotalDonatedWei(totalW);
    setMyDonatedWei(myW);
    setContractBalWei(balW);
  }, [enabled, getProvider, account]);

  const refreshCharities = useCallback(async () => {
    if (!enabled) return;
    const c = await getReadContract();

    // These must exist in your contract ABI (V2/V3)
    const count = Number(await c.charitiesCount());
    const addrs = await Promise.all(
      Array.from({ length: count }, (_, i) => c.charities(i))
    );

    // Try reading on-chain names (V3). If not present in ABI/contract, fallback to address.
    const rows = await Promise.all(
      addrs.map(async (a) => {
        let name = "";
        let allocatedWei = null;

        try {
          name = await c.charityName(a);
        } catch {
          name = "";
        }

        try {
          allocatedWei = await c.charityBalanceWei(a);
        } catch {
          allocatedWei = null;
        }

        const label = (name && name.trim().length > 0) ? name : shortHex(a);
        return { address: a, name: label, allocatedWei };
      })
    );

    setCharities(rows);

    // Keep selection stable
    if (!selectedCharity && rows.length > 0) {
      setSelectedCharity(rows[0].address);
    } else if (selectedCharity) {
      const stillExists = rows.some((r) => safeLower(r.address) === safeLower(selectedCharity));
      if (!stillExists && rows.length > 0) setSelectedCharity(rows[0].address);
    }
  }, [enabled, selectedCharity, getProvider]);

  const refreshAll = useCallback(async () => {
    try {
      await Promise.all([refreshCore(), refreshCharities()]);
      message.success("Updated");
    } catch (e) {
      message.error(e?.message ?? String(e));
    }
  }, [refreshCore, refreshCharities]);

  async function donateToCharity({ charity, amountEth }) {
    const value = ethers.parseEther(String(amountEth).trim());
    if (minDonationWei > 0n && value < minDonationWei) {
      throw new Error(`Donation too small. Min is ${ethers.formatEther(minDonationWei)} ETH`);
    }

    const c = await getWriteContract();

    // Must exist in ABI/contract:
    // function donateToCharity(address charity) external payable
    const tx = await c.donateToCharity(charity, { value });
    message.loading({ content: "Donation sent…", key: "donate" });
    await tx.wait();
    message.success({ content: "Donation confirmed ✅", key: "donate" });

    await refreshAll();
  }

  async function withdrawOwner({ to, amountEth }) {
    if (!ethers.isAddress(to)) throw new Error("Invalid recipient address.");
    if (!isOwner) throw new Error("Only owner can withdraw.");

    const amountWei = ethers.parseEther(String(amountEth).trim());
    const c = await getWriteContract();

    const tx = await c.withdraw(to, amountWei);
    message.loading({ content: "Withdraw sent…", key: "withdraw" });
    await tx.wait();
    message.success({ content: "Withdraw confirmed ✅", key: "withdraw" });

    await refreshAll();
  }

  return {
    // core
    owner, minDonationWei, totalDonatedWei, contractBalWei, myDonatedWei, isOwner,
    // charities
    charities, selectedCharity, setSelectedCharity,
    // actions
    refreshAll, refreshCore, refreshCharities,
    donateToCharity, withdrawOwner,
  };
}
