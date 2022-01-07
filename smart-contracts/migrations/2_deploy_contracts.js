const Drawing = artifacts.require('./Drawing.sol')

module.exports = function(deployer) {
  deployer.deploy(Drawing, 10, '')
}
