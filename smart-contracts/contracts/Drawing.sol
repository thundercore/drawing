pragma solidity ^0.5.0;

import "@openzeppelin/contracts/ownership/Ownable.sol";

contract Drawing is Ownable {
    event EnrollmentPeriodStarted(
        string rule,
        uint256 startBlockNumber,
        bytes32 lockedSeed
    );
    event EnrollmentPeriodEnded(uint256 blockNumber);
    event ParticipantsEnrolled(uint32[] participants);
    event WinnersSelected(uint32[] winners);

    enum DrawingState {
        Open,
        EnrollmentStarted,
        EnrollmentEnded,
        WinnersCalculated
    }

    DrawingState public currentState = DrawingState.Open;
    uint256 public revealBlockNumber;
    bytes32 public lockedSeed;
    bytes32 public blockHash;
    uint32 public numWinners;
    string public name;
    string public rule;

    uint32[] public participants;
    uint32[] public winners;

    constructor(uint32 _numWinners, string memory _name) public {
        numWinners = _numWinners;
        name = _name;
    }

    function startEnrollment(string calldata _rule, bytes32 _lockedSeed)
        external
        onlyOwner
    {
        require(
            currentState == DrawingState.Open,
            "Drawing must be in open state"
        );
        lockedSeed = _lockedSeed;
        rule = _rule;
        currentState = DrawingState.EnrollmentStarted;
        emit EnrollmentPeriodStarted(rule, block.number, lockedSeed);
    }

    function endEnrollment() external onlyOwner {
        require(
            currentState == DrawingState.EnrollmentStarted,
            "Drawing must be in enrollment state"
        );

        currentState = DrawingState.EnrollmentEnded;
        revealBlockNumber = block.number;
        emit EnrollmentPeriodEnded(block.number);
    }

    function calculateWinners() external onlyOwner {
        require(
            currentState == DrawingState.EnrollmentEnded,
            "Drawing must be in enrollment ended state"
        );

        blockHash = blockhash(revealBlockNumber);
        bytes32 seed = blockHash ^ lockedSeed;

        uint32 need = numWinners;
        uint32 count = uint32(participants.length);
        if (need > count) {
            need = count;
        }

        uint32[] memory peoples = new uint32[](count);
        for (uint32 i = 0; i < count; ++i) {
            peoples[i] = i;
        }

        uint32[] memory mWinners = new uint32[](need);
        uint32 curWinner;
        for (uint32 i = 0; i < need; i++) {
            uint32 winnerIdx = uint32(uint256(seed) % count);
            curWinner = participants[peoples[winnerIdx]];
            mWinners[i] = curWinner;
            winners.push(curWinner);
            count--;
            peoples[winnerIdx] = peoples[count];
            seed = keccak256(abi.encodePacked(seed));
        }

        currentState = DrawingState.WinnersCalculated;

        emit WinnersSelected(winners);
    }

    function adminBatchEnroll(uint32[] calldata _participants)
        external
        onlyOwner
    {
        require(
            currentState == DrawingState.EnrollmentStarted,
            "Drawing must be in the enrollment state"
        );

        for (uint32 i = 0; i < _participants.length; i++) {
            participants.push(_participants[i]);
        }
        emit ParticipantsEnrolled(_participants);
    }
}
