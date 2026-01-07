import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { REQUIRED_CHAIN_ID } from "../config";
import { message } from "antd";

export function useWallet() {
  const hasMM = useMemo(() => typeof window !== "undefined" && !!window.ethereum, []);

  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [status, setStatus] = useState("Not connected");

  async function getProvider() {
    if (!window.ethereum) throw new Error("MetaMask not found");
    return new ethers.BrowserProvider(window.ethereum);
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

  const wrongNetwork = chainId !== null && chainId !== REQUIRED_CHAIN_ID;

  // Refresh page when user changes account/network
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

  return { hasMM, account, chainId, status, wrongNetwork, connect, getProvider };
}
