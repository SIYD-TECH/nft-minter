// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BotchainNFT
 * @dev Full-featured ERC-721 NFT Smart Contract with Enumerable & URIStorage
 * Designed for deployment on Botchain Testnet (Chain ID: 968)
 */

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

interface IERC721Enumerable is IERC721 {
    function totalSupply() external view returns (uint256);
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
    function tokenByIndex(uint256 index) external view returns (uint256);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

contract BotchainNFT is IERC721, IERC721Metadata, IERC721Enumerable {
    string private _name;
    string private _symbol;
    address public owner;

    uint256 private _nextTokenId = 1;
    uint256 public maxSupply;
    uint256 public mintPrice; // in wei (BOT)

    // Token ID => Owner address
    mapping(uint256 => address) private _owners;

    // Owner address => Token count
    mapping(address => uint256) private _balances;

    // Token ID => Approved address
    mapping(uint256 => address) private _tokenApprovals;

    // Owner address => Operator approvals
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // Token ID => tokenURI string
    mapping(uint256 => string) private _tokenURIs;

    // Enumerable mappings
    uint256[] private _allTokens;
    mapping(uint256 => uint256) private _allTokensIndex;
    mapping(address => mapping(uint256 => uint256)) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex;

    event NFTMinted(uint256 indexed tokenId, address indexed recipient, string tokenURI);
    event MintPriceUpdated(uint256 newPrice);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        uint256 mintPrice_
    ) {
        _name = name_;
        _symbol = symbol_;
        maxSupply = maxSupply_;
        mintPrice = mintPrice_;
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return interfaceId == type(IERC165).interfaceId
            || interfaceId == type(IERC721).interfaceId
            || interfaceId == type(IERC721Metadata).interfaceId
            || interfaceId == type(IERC721Enumerable).interfaceId;
    }

    function name() public view override returns (string memory) {
        return _name;
    }

    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_owners[tokenId] != address(0), "URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    function balanceOf(address tokenOwner) public view override returns (uint256) {
        require(tokenOwner != address(0), "Address zero is not a valid owner");
        return _balances[tokenOwner];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Owner query for nonexistent token");
        return tokenOwner;
    }

    function totalSupply() public view override returns (uint256) {
        return _allTokens.length;
    }

    function tokenByIndex(uint256 index) public view override returns (uint256) {
        require(index < totalSupply(), "Global index out of bounds");
        return _allTokens[index];
    }

    function tokenOfOwnerByIndex(address tokenOwner, uint256 index) public view override returns (uint256) {
        require(index < balanceOf(tokenOwner), "Owner index out of bounds");
        return _ownedTokens[tokenOwner][index];
    }

    /**
     * @notice Helper to fetch all token IDs owned by an address in a single RPC call
     */
    function tokensOfOwner(address tokenOwner) external view returns (uint256[] memory) {
        uint256 tokenCount = _balances[tokenOwner];
        uint256[] memory tokens = new uint256[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            tokens[i] = _ownedTokens[tokenOwner][i];
        }
        return tokens;
    }

    /**
     * @notice Mint an NFT to the caller with a custom IPFS / metadata URI
     * @param uri The token metadata URI (e.g. ipfs://... or https://...)
     */
    function mint(string memory uri) external payable returns (uint256) {
        return mintTo(msg.sender, uri);
    }

    /**
     * @notice Mint an NFT to a specific recipient with a custom metadata URI
     */
    function mintTo(address recipient, string memory uri) public payable returns (uint256) {
        require(recipient != address(0), "Cannot mint to zero address");
        require(msg.value >= mintPrice, "Insufficient BOT fee sent for minting");
        if (maxSupply > 0) {
            require(_allTokens.length < maxSupply, "Max supply reached");
        }

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(recipient, tokenId);
        _tokenURIs[tokenId] = uri;

        emit NFTMinted(tokenId, recipient, uri);
        return tokenId;
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // Internal ERC-721 mechanics
    function _safeMint(address to, uint256 tokenId) internal {
        _mint(to, tokenId);
        require(
            _checkOnERC721Received(address(0), to, tokenId, ""),
            "Transfer to non ERC721Receiver implementer"
        );
    }

    function _mint(address to, uint256 tokenId) internal {
        _balances[to] += 1;
        _owners[tokenId] = to;

        _addTokenToOwnerEnumeration(to, tokenId);
        _addTokenToAllTokensEnumeration(tokenId);

        emit Transfer(address(0), to, tokenId);
    }

    function approve(address to, uint256 tokenId) public override {
        address tokenOwner = ownerOf(tokenId);
        require(to != tokenOwner, "Approval to current owner");
        require(
            msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender),
            "Caller is not owner nor approved for all"
        );

        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view override returns (address) {
        require(_owners[tokenId] != address(0), "Approved query for nonexistent token");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public override {
        require(operator != msg.sender, "Approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address tokenOwner, address operator) public view override returns (bool) {
        return _operatorApprovals[tokenOwner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Transfer caller is not owner nor approved");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public override {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Transfer caller is not owner nor approved");
        _safeTransfer(from, to, tokenId, data);
    }

    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "Transfer to non ERC721Receiver implementer");
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "Transfer from incorrect owner");
        require(to != address(0), "Transfer to zero address");

        // Clear approvals
        _tokenApprovals[tokenId] = address(0);

        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        _removeTokenFromOwnerEnumeration(from, tokenId);
        _addTokenToOwnerEnumeration(to, tokenId);

        emit Transfer(from, to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || isApprovedForAll(tokenOwner, spender) || getApproved(tokenId) == spender);
    }

    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) private returns (bool) {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("Transfer to non ERC721Receiver implementer");
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        }
        return true;
    }

    // Enumeration helpers
    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        uint256 length = _balances[to] - 1;
        _ownedTokens[to][length] = tokenId;
        _ownedTokensIndex[tokenId] = length;
    }

    function _addTokenToAllTokensEnumeration(uint256 tokenId) private {
        _allTokensIndex[tokenId] = _allTokens.length;
        _allTokens.push(tokenId);
    }

    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private {
        uint256 lastTokenIndex = _balances[from];
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
            _ownedTokens[from][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }

        delete _ownedTokensIndex[tokenId];
        delete _ownedTokens[from][lastTokenIndex];
    }
}
