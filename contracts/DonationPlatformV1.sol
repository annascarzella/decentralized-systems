// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";



/**
 * @title DonationPlatformV1
 * @dev First version of an upgradeable donation platform. Users can send ETH to a contract and the owner can withdraw ETH.
 */
contract DonationPlatformV1 is
    Initializable,                      // initialization control
    OwnableUpgradeable,                 // ownership control
    ReentrancyGuardUpgradeable,         // reentrancy protection
    UUPSUpgradeable                     // upgrade system
{
    // -----------------------
    // Storage (lives in Proxy)
    // -----------------------

    uint256 public minDonationWei;      // minimum donation allowed
    uint256 public totalDonated;        // total of all donations received

    mapping(address => uint256) public donatedBy;    // donations by address

    // -----------------------
    // Events
    // -----------------------

    event Donated(address indexed donor, uint256 amountWei);        // log when someone donates
    event Withdrawn(address indexed to, uint256 amountWei);         // log when someone withdraw

    // -----------------------
    // Initializer (replaces constructor)
    // -----------------------

    function initialize(uint256 _minDonationWei) public initializer {
        require(_minDonationWei > 0, "Min donation must be > 0");

        __Ownable_init(msg.sender);     // sets contract owner to whoever called initialize
        __ReentrancyGuard_init();       // sets internal guard status for reentrancy protection
        __UUPSUpgradeable_init();       // initializes upgrade system internals

        minDonationWei = _minDonationWei;
    }

    // -----------------------
    // Donation logic
    // -----------------------


    // This function checks that the donation is at least the minimum; it adds the donation amount to the sender's personal total; it adds the donation amount to global total; it emits an event.
    // The ETH goes into the contract's balance automatically.
    function donate() external payable {        // external means callable from outside (users/other contracts), payable that it's allowed to receive ETH 
        require(msg.value >= minDonationWei, "Donation too small");         // msg.value -> how much ETH was sent with the call

        donatedBy[msg.sender] += msg.value;                 // msg.sender -> who called the function (address)
        totalDonated += msg.value;

        emit Donated(msg.sender, msg.value);
    }

    // -----------------------
    // Withdraw logic
    // -----------------------

    // This function makes it possible to withdrawn. Only the owner can call this function.
    function withdraw(address payable to, uint256 amountWei)
        external
        onlyOwner
        nonReentrant
    {
        require(to != address(0), "Invalid recipient");
        require(amountWei > 0, "Amount must be > 0");
        require(amountWei <= address(this).balance, "Not enough ETH");      // address(this).balance is the ETH balance currently stored in this contract

        (bool ok, ) = to.call{value: amountWei}("");
        require(ok, "Transfer failed");

        emit Withdrawn(to, amountWei);
    }

    // -----------------------
    // Upgrade authorization
    // -----------------------

    // UUPS upgradeable contracts have an upgrade function somewhere in the inherited code and before upgrading OpenZeppelin will call this function.
    // Upgrades are authorized only if onlyOwner passes, otherwise it fails.
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
