// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./DonationPlatformV1.sol";

contract DonationPlatformV2 is DonationPlatformV1 {
    // -----------------------
    // NEW STORAGE (append only!)
    // -----------------------

    mapping(address => bool) public isCharity;              // whitelist
    mapping(address => uint256) public charityBalanceWei;   // funds reserved per org
    address[] public charities;                             // optional: list for UI

    // -----------------------
    // NEW EVENTS (logs)
    // -----------------------

    event CharityAdded(address indexed charity);
    event CharityRemoved(address indexed charity);

    // Full donation log (recommended)
    event DonationToCharity(
        address indexed donor,
        address indexed charity,
        uint256 amountWei
    );

    event CharityWithdrawn(
        address indexed charity,
        address indexed to,
        uint256 amountWei
    );

    // -----------------------
    // V2 INITIALIZER (optional but handy)
    // -----------------------
    function initializeV2(address[] calldata initialCharities) external reinitializer(2) {
        for (uint256 i = 0; i < initialCharities.length; i++) {
            _addCharity(initialCharities[i]);
        }
    }

    // -----------------------
    // Charity management (owner)
    // -----------------------
    function addCharity(address charity) external onlyOwner {
        _addCharity(charity);
    }

    function removeCharity(address charity) external onlyOwner {
        require(isCharity[charity], "Not a charity");
        isCharity[charity] = false;
        emit CharityRemoved(charity);
        // Note: we do NOT remove from `charities[]` to keep it simple.
        // UI can filter by isCharity[addr] == true.
    }

    function _addCharity(address charity) internal {
        require(charity != address(0), "Invalid charity");
        require(!isCharity[charity], "Already charity");
        isCharity[charity] = true;
        charities.push(charity);
        emit CharityAdded(charity);
    }

    function charitiesCount() external view returns (uint256) {
        return charities.length;
    }

    // -----------------------
    // Donation logic (new)
    // -----------------------
    function donateToCharity(address charity) external payable {
        require(isCharity[charity], "Charity not allowed");
        require(msg.value >= minDonationWei, "Donation too small");

        // keep original totals too (from V1)
        donatedBy[msg.sender] += msg.value;
        totalDonated += msg.value;

        // allocate funds to that org
        charityBalanceWei[charity] += msg.value;

        emit DonationToCharity(msg.sender, charity, msg.value);
    }

    // Optional: override V1 donate() to still work by routing to a default org
    // (Only do this if you want "donate()" to still be usable after V2)
    // function donate() external payable override { ... }

    // -----------------------
    // Withdraw logic (new): org withdraws its own balance
    // -----------------------
    function withdrawMyFunds(address payable to, uint256 amountWei)
        external
        nonReentrant
    {
        require(isCharity[msg.sender], "Only charity");
        require(to != address(0), "Invalid recipient");
        require(amountWei > 0, "Amount must be > 0");
        require(amountWei <= charityBalanceWei[msg.sender], "Not enough allocated");

        charityBalanceWei[msg.sender] -= amountWei;

        (bool ok, ) = to.call{value: amountWei}("");
        require(ok, "Transfer failed");

        emit CharityWithdrawn(msg.sender, to, amountWei);
    }
}
