// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedLearningProgress - Private Learning Progress Tracker
/// @notice Allows students to record encrypted study minutes and task completion count
/// @dev Uses FHE to store and accumulate encrypted learning data on-chain
contract EncryptedLearningProgress is SepoliaConfig {
    // Mapping from user address to their encrypted total study minutes
    mapping(address => euint32) private _encryptedStudyMinutes;
    
    // Mapping from user address to their encrypted task completion count
    mapping(address => euint32) private _encryptedTaskCount;
    
    // Mapping to track if user has initialized their progress
    mapping(address => bool) private _hasInitialized;

    event StudyMinutesAdded(address indexed user, uint256 timestamp);
    event TaskCompleted(address indexed user, uint256 timestamp);

    /// @notice Add study minutes to user's encrypted total
    /// @param encryptedMinutes The encrypted number of study minutes to add
    /// @param inputProof The FHE input proof
    function addStudyMinutes(externalEuint32 encryptedMinutes, bytes calldata inputProof) external {
        euint32 encryptedMinutesValue = FHE.fromExternal(encryptedMinutes, inputProof);
        
        // Initialize if first time
        if (!_hasInitialized[msg.sender]) {
            _encryptedStudyMinutes[msg.sender] = encryptedMinutesValue;
            _hasInitialized[msg.sender] = true;
        } else {
            // Add to existing total using FHE addition
            _encryptedStudyMinutes[msg.sender] = FHE.add(
                _encryptedStudyMinutes[msg.sender],
                encryptedMinutesValue
            );
        }

        // Grant decryption permissions to the user
        FHE.allowThis(_encryptedStudyMinutes[msg.sender]);
        FHE.allow(_encryptedStudyMinutes[msg.sender], msg.sender);

        emit StudyMinutesAdded(msg.sender, block.timestamp);
    }

    /// @notice Complete a task (increment task count by 1)
    /// @param encryptedTaskCount The encrypted task count to add (typically 1)
    /// @param inputProof The FHE input proof
    function completeTask(externalEuint32 encryptedTaskCount, bytes calldata inputProof) external {
        euint32 taskCount = FHE.fromExternal(encryptedTaskCount, inputProof);
        
        // Initialize if first time
        if (!_hasInitialized[msg.sender]) {
            _encryptedTaskCount[msg.sender] = taskCount;
            _hasInitialized[msg.sender] = true;
        } else {
            // Add to existing count using FHE addition
            _encryptedTaskCount[msg.sender] = FHE.add(
                _encryptedTaskCount[msg.sender],
                taskCount
            );
        }

        // Grant decryption permissions to the user
        FHE.allowThis(_encryptedTaskCount[msg.sender]);
        FHE.allow(_encryptedTaskCount[msg.sender], msg.sender);

        emit TaskCompleted(msg.sender, block.timestamp);
    }

    /// @notice Get the encrypted study minutes for a user
    /// @param user The user address
    /// @return encryptedMinutes The encrypted study minutes
    function getEncryptedStudyMinutes(address user) external view returns (euint32 encryptedMinutes) {
        return _encryptedStudyMinutes[user];
    }

    /// @notice Get the encrypted task count for a user
    /// @param user The user address
    /// @return encryptedTaskCount The encrypted task completion count
    function getEncryptedTaskCount(address user) external view returns (euint32 encryptedTaskCount) {
        return _encryptedTaskCount[user];
    }

    /// @notice Check if a user has initialized their progress
    /// @param user The user address
    /// @return Whether the user has initialized
    function hasInitialized(address user) external view returns (bool) {
        return _hasInitialized[user];
    }
}

