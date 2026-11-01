// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
interface IBinanceAgentId { function ownerOf(uint256 tokenId) external view returns(address); }

/// @notice Fixed-price mint for the Binance-issued .ai Agent ID collection on BSC.
contract JinMint is ERC20, ReentrancyGuard {
    uint256 public constant PRICE = 0.002 ether;
    uint256 public constant FREE_CAP = 4444;
    uint256 public constant PAID_CAP = 10000;
    uint256 public constant TOKENS_PER_UNIT = 1000 ether;
    IBinanceAgentId public constant AGENT_ID = IBinanceAgentId(0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F);
    address payable public immutable treasury;
    uint64 public opensAt;
    uint256 public freeMinted;
    uint256 public paidMinted;
    mapping(bytes32=>bool) public freeClaimed;
    mapping(bytes32=>uint256) public paidByIdentity;
    error InvalidConfiguration(); error NotOpen(); error Ineligible();
    error QuotaExceeded(); error IncorrectPayment(); error SoldOut();
    error Unauthorized(); error TransferFailed(); error LaunchAlreadyScheduled(); error InvalidLaunchTime();
    event UnitsMinted(address indexed wallet,bytes32 indexed identity,uint256 quantity,bool free);
    event TreasuryWithdrawal(uint256 amount);
    event LaunchScheduled(uint64 opensAt);

    /// @dev Explicit signer because a CREATE2 proxy is msg.sender during deployment.
    constructor(address payable deploymentSigner) ERC20("Jin Agent","JIN") {
        if(deploymentSigner==address(0)||address(AGENT_ID).code.length==0) revert InvalidConfiguration();
        treasury=deploymentSigner;
    }
    /// @notice Schedule once. Minting stays closed while opensAt is zero.
    function scheduleMint(uint64 launchTime) external {
        if(msg.sender!=treasury) revert Unauthorized();
        if(opensAt!=0) revert LaunchAlreadyScheduled();
        if(launchTime<block.timestamp||launchTime==0) revert InvalidLaunchTime();
        opensAt=launchTime; emit LaunchScheduled(launchTime);
    }
    /// @param handle Binance-issued name without .ai (3–15 lowercase letters/digits).
    function eligibility(address wallet,string calldata handle) external view returns(bytes32 identity,uint256 freeRemaining,uint256 paidRemaining) {
        identity=_identity(wallet,handle);
        if(identity==bytes32(0)) return(identity,0,0);
        freeRemaining=freeClaimed[identity]||freeMinted>=FREE_CAP?0:1;
        uint256 quota=9-paidByIdentity[identity]; uint256 available=PAID_CAP-paidMinted;
        paidRemaining=quota<available?quota:available;
    }
    function claimFree(string calldata handle) external nonReentrant {
        bytes32 identity=_requireIdentity(handle);
        if(freeClaimed[identity]) revert QuotaExceeded();
        if(freeMinted>=FREE_CAP) revert SoldOut();
        freeClaimed[identity]=true; ++freeMinted;
        _mint(msg.sender,TOKENS_PER_UNIT); emit UnitsMinted(msg.sender,identity,1,true);
    }
    function paidMint(uint256 quantity,string calldata handle) external payable nonReentrant {
        bytes32 identity=_requireIdentity(handle);
        if(quantity==0||quantity>9||paidByIdentity[identity]+quantity>9) revert QuotaExceeded();
        if(paidMinted+quantity>PAID_CAP) revert SoldOut();
        if(msg.value!=quantity*PRICE) revert IncorrectPayment();
        paidByIdentity[identity]+=quantity; paidMinted+=quantity;
        _mint(msg.sender,quantity*TOKENS_PER_UNIT); emit UnitsMinted(msg.sender,identity,quantity,false);
    }
    function withdraw() external nonReentrant {
        if(msg.sender!=treasury) revert Unauthorized();
        uint256 amount=address(this).balance;
        (bool ok,)=treasury.call{value:amount}(""); if(!ok) revert TransferFailed();
        emit TreasuryWithdrawal(amount);
    }
    function _requireIdentity(string calldata handle) private view returns(bytes32 identity) {
        if(opensAt==0||block.timestamp<opensAt) revert NotOpen();
        identity=_identity(msg.sender,handle); if(identity==bytes32(0)) revert Ineligible();
    }
    function _identity(address wallet,string calldata handle) private view returns(bytes32) {
        bytes memory label=bytes(handle);
        if(label.length<3||label.length>15) return bytes32(0);
        for(uint256 i;i<label.length;++i){bytes1 c=label[i];if(!((c>=0x61&&c<=0x7a)||(c>=0x30&&c<=0x39)))return bytes32(0);}
        bytes32 key=keccak256(label);
        try AGENT_ID.ownerOf(uint256(key)) returns(address owner){return owner==wallet&&owner!=address(0)?key:bytes32(0);}
        catch{return bytes32(0);}
    }
}
