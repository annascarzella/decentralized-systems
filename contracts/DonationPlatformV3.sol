// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./DonationPlatformV2.sol";

/**
 * @title DonationPlatformV3
 * @dev Adds on-chain charity names (validated).
 * Storage-safe upgrade: ONLY appends new storage after V2.
 */
contract DonationPlatformV3 is DonationPlatformV2 {
    // -----------------------
    // NEW STORAGE (append-only!)
    // -----------------------
    mapping(address => string) public charityName;

    // -----------------------
    // EVENTS
    // -----------------------
    event CharityNameSet(address indexed charity, string name);

    // -----------------------
    // V3 INITIALIZER (optional)
    // -----------------------
    /**
     * @dev Optional: set names for existing charities in a single tx.
     * Can only be called once due to reinitializer(3).
     */
    function initializeV3(address[] calldata addrs, string[] calldata names)
        external
        reinitializer(3)
    {
        require(addrs.length == names.length, "Length mismatch");

        for (uint256 i = 0; i < addrs.length; i++) {
            _setCharityName(addrs[i], names[i]);
        }
    }

    // -----------------------
    // OWNER FUNCTIONS
    // -----------------------

    /**
     * @dev Owner sets/updates a charity's name.
     * Recommended model: avoids impersonation/spam.
     */
    function setCharityName(address charity, string calldata name) external onlyOwner {
        _setCharityName(charity, name);
    }

    /**
     * @dev Convenience: owner sets multiple names in one call.
     */
    function setCharityNames(address[] calldata addrs, string[] calldata names) external onlyOwner {
        require(addrs.length == names.length, "Length mismatch");
        for (uint256 i = 0; i < addrs.length; i++) {
            _setCharityName(addrs[i], names[i]);
        }
    }

    // -----------------------
    // INTERNAL HELPERS
    // -----------------------
    function _setCharityName(address charity, string calldata name) internal {
        require(isCharity[charity], "Not a charity");
        _validateName(name);

        charityName[charity] = name;
        emit CharityNameSet(charity, name);
    }

    /**
     * @dev Basic validation:
     * - length bounds to reduce abuse and gas
     * - allow only a conservative set of characters
     */
    function _validateName(string calldata name) internal pure {
        bytes calldata b = bytes(name);

        require(b.length >= 3, "Name too short");
        require(b.length <= 32, "Name too long");

        // Allow: A-Z a-z 0-9 space . , ' - &
        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];

            bool ok =
                (c >= 0x30 && c <= 0x39) || // 0-9
                (c >= 0x41 && c <= 0x5A) || // A-Z
                (c >= 0x61 && c <= 0x7A) || // a-z
                (c == 0x20) ||              // space
                (c == 0x2E) ||              // .
                (c == 0x2C) ||              // ,
                (c == 0x27) ||              // '
                (c == 0x2D) ||              // -
                (c == 0x26);                // &
            require(ok, "Invalid character");
        }
    }
}
