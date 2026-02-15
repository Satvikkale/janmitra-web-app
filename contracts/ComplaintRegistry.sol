// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ComplaintRegistry
 * @notice Immutable on-chain registry for civic complaint lifecycle events.
 *         Deployed on Polygon Amoy (testnet) or Polygon PoS (mainnet).
 */
contract ComplaintRegistry {
    enum Status { Open, Assigned, InProgress, Resolved, Closed }

    struct Complaint {
        bytes32 complaintHash;   // SHA-256 hash of original complaint data
        address filedBy;         // wallet that submitted the tx
        string  orgId;           // NGO / org assigned to handle
        string  assignedTo;      // individual handler id
        Status  status;
        uint256 createdAt;
        uint256 lastUpdatedAt;
    }

    // complaintId (MongoDB _id as string) => on-chain record
    mapping(string => Complaint) public complaints;

    // ── Events ───────────────────────────────────────────────
    event ComplaintFiled(
        string indexed complaintId,
        bytes32 complaintHash,
        uint256 timestamp
    );

    event ComplaintAssigned(
        string indexed complaintId,
        string orgId,
        string assignedTo,
        uint256 timestamp
    );

    event StatusUpdated(
        string indexed complaintId,
        uint8 newStatus,
        uint256 timestamp
    );

    // ── Modifiers ────────────────────────────────────────────
    modifier complaintExists(string calldata _id) {
        require(complaints[_id].createdAt != 0, "Complaint does not exist");
        _;
    }

    // ── Write Functions ──────────────────────────────────────

    /**
     * @notice File a new complaint on-chain.
     * @param _complaintId  The off-chain complaint ID (MongoDB ObjectId string).
     * @param _complaintHash SHA-256 hash of the canonical complaint JSON.
     */
    function fileComplaint(
        string calldata _complaintId,
        bytes32 _complaintHash
    ) external {
        require(complaints[_complaintId].createdAt == 0, "Already filed");

        complaints[_complaintId] = Complaint({
            complaintHash: _complaintHash,
            filedBy: msg.sender,
            orgId: "",
            assignedTo: "",
            status: Status.Open,
            createdAt: block.timestamp,
            lastUpdatedAt: block.timestamp
        });

        emit ComplaintFiled(_complaintId, _complaintHash, block.timestamp);
    }

    /**
     * @notice Record that a complaint has been assigned.
     */
    function assignComplaint(
        string calldata _complaintId,
        string calldata _orgId,
        string calldata _assignedTo
    ) external complaintExists(_complaintId) {
        Complaint storage c = complaints[_complaintId];
        c.orgId = _orgId;
        c.assignedTo = _assignedTo;
        c.status = Status.Assigned;
        c.lastUpdatedAt = block.timestamp;

        emit ComplaintAssigned(_complaintId, _orgId, _assignedTo, block.timestamp);
    }

    /**
     * @notice Update the status of a complaint.
     */
    function updateStatus(
        string calldata _complaintId,
        uint8 _newStatus
    ) external complaintExists(_complaintId) {
        require(_newStatus <= uint8(Status.Closed), "Invalid status");

        Complaint storage c = complaints[_complaintId];
        c.status = Status(_newStatus);
        c.lastUpdatedAt = block.timestamp;

        emit StatusUpdated(_complaintId, _newStatus, block.timestamp);
    }

    // ── Read Functions ───────────────────────────────────────

    /**
     * @notice Verify that a complaint's data has not been tampered with.
     * @return true if the supplied hash matches the on-chain hash.
     */
    function verifyComplaint(
        string calldata _complaintId,
        bytes32 _expectedHash
    ) external view complaintExists(_complaintId) returns (bool) {
        return complaints[_complaintId].complaintHash == _expectedHash;
    }
}
