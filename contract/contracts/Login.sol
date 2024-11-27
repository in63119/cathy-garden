// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";


contract Login is Ownable{
    uint a = 0;

    constructor() Ownable(msg.sender) {}

    function get() view public returns(uint) {
        return a;
    }
}
