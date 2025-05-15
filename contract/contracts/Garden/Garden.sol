// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Garden is Ownable {
  mapping(address => string) private family;

  constructor() Ownable(msg.sender) {}
}
