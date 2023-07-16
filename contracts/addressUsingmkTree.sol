// SPDX-License-Identifier: MIT
pragma solidity  0.8.18;

contract WhitelistAddress {

    bytes32 public merkleRoot;


    constructor(bytes32 _merkleRoot) {

        merkleRoot = _merkleRoot;
        
    }

    // here we are not storing the addr of the each user , we are only storing the root of the merkle tree which get initialized in the constructor


    // CheckInwhitelist which takes in a proof and maxAllowancetoMint is the var thats keeps the track of the number of nft given adddress can mint 

    function CheckInwhitelist(bytes32[] calldata proof, uint64 maxAllowancetoMint) view public returns (bool) {

        bytes32 leaf =  keccak256(abi.encode(msg.sender,maxAllowancetoMint));

        bool verified  = MerkleProof.verify(proof, merkleRoot,leaf);
        return verified;

    }

}