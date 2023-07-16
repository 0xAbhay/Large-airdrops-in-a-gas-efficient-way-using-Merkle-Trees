// here we verify that the proof sent by the user is indeed valid. 

const { expect } = require("chai");
const { ethers } = require("hardhat");

const keccak256 = require("keccak256");

const { MerkleTree } = require("merkletreejs");

function encodeleaf(address, spots) {
    // same as abi.encodedpacked in solidity 
    return ethers.utils.defaultAbiCoder.encode(
        ["address", "uint64"] //the datatypes of arguments to encode
        [address, spots] // the actual values
    )
}

describe("Merkle Trees", function () {
    it("Should be able to verify if address is in whitelist or not", async function () {


        // get the bunction of test addresses
        //Hardhat return 10 signer when running in a test enviroment 

        const testAddresses = await ethers.getSigner();

        // create an array of Abi ENcode elements to put in the merkle tree 
        const List = [

            encodeleaf(testAddresses[0].address, 2),
            encodeleaf(testAddresses[1].address, 2),
            encodeleaf(testAddresses[2].address, 2),
            encodeleaf(testAddresses[3].address, 2),
            encodeleaf(testAddresses[4].address, 2),
            encodeleaf(testAddresses[5].address, 2),

        ];

        // Using keccak256 as the hashing algorithm, create a Merkle Tree
        // We use keccak256 because Solidity supports it
        // We can use keccak256 directly in smart contracts for verification
        // Make sure to sort the tree so it can be reproduced deterministically each time

        const merkletree = new MerkleTree(List, keccak256, {
            hashLeaves: true, // hash each leaf using keccak256 to make them fixedSize
            sortPairs: true, //sort  the tree for deterministic output 
            sortLeaves: true,
        });

        //compute the merkle tree root in hexadecimal format
        const root = merkletree.getHexRoot();

        //deploy the whitlelist COntract 
        const Whitelist = await ethers.getContractFactory("WhitelistAddress");
        const whitelist = await Whitelist.deploy(root);
        await whitelist.deployed();

        //check for valid address
        for (let i = 0; i < 6; i++) {

            //compute the merkle proof for test addreess[i]
            const leaf = keccak256(List[i]); // hash of the each node
            const proof = merkletree.getHexProof(leaf); // get the merkle proof


            // Connect the current address being tested to the Whitelist contract
            // as the 'caller'. So the contract's `msg.sender` value is equal to the value being checked
            // This is done because our contract uses `msg.sender` as the 'original value' for
            // the address when verifying the Merkle Proof
            const connectWhitelist = await whitelist.connect(testAddresses[i]);

            // Verify that the contract can verify the presence of this address
            // in the Merkle Tree using just the Root provided to it
            // By giving it the Merkle Proof and the original values
            // It calculates `address` using `msg.sender`, and we provide it the number of NFTs
            // that the address can mint ourselves

            const verified = await connectWhitelist.CheckInwhitelist(proof, 2);
            except(verified).to.equal(true);

        }

        // check for invalid addr
        const verifiedInvalid = await whitelist.CheckInwhitelist([], 2);
        expect(verifiedInvalid).to.equal(false);

    })
})