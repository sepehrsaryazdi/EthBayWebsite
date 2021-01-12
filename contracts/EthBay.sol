pragma solidity ^0.5.16;

contract EthBay {

  uint uniqAssetID = 0;

  struct Listing {
    string name;
    string imageurl;
    string description;
    bool available;
    uint price;
    uint stock;
    address owner;
  }

  event LogListAsset(
    address indexed _seller,
    string _name,
    uint256 _price
  );
  event LogPurchaseAsset(
    address indexed _seller,
    address indexed _buyer,
    string _name,
    uint _price
);



  mapping(address => Listing) listings; // Address of Asset from listingIDs which maps to the Listing struct

  mapping(address => address[]) assetOwners; // Address of asset owner which maps to an array of addresses that give the keys to which listingIDs are owned.

  address[] listingIDs; // List of all asset addresses/IDs

  function listAsset(string memory _name, string memory _imageurl, string memory _description, uint _price, uint _stock) public {
    require(_stock > 0); // "You must have at least one stock available before listing."
    uniqAssetID++;
    listingIDs.push(address( uniqAssetID));
    listings[address(uniqAssetID)] = Listing(_name, _imageurl, _description, true, _price, _stock, msg.sender);
    assetOwners[msg.sender].push(address(uniqAssetID));

    emit LogListAsset(msg.sender, _name, _price);

}

  function removeAsset(address _assetaddress) public {
    require(listings[_assetaddress].owner == msg.sender,  "You cannot edit this asset as it does not belong to you." );
    uint assetIndex = 0;
    for (uint i = 0; i < listingIDs.length ; i ++){
      if (listingIDs[i] == _assetaddress){
        assetIndex = i;
        break;
      }

    }
    uint assetAddressIndex;
    for (uint i = 0; i < assetOwners[msg.sender].length ; i ++){
      if (assetOwners[msg.sender][i] == _assetaddress){
        assetAddressIndex = i;
        break;
      }

    }

    listingIDs[assetIndex] = listingIDs[listingIDs.length-1];
    delete listingIDs[listingIDs.length-1];
    listingIDs.length--;

    assetOwners[msg.sender][assetAddressIndex] = assetOwners[msg.sender][assetOwners[msg.sender].length -1];
    delete assetOwners[msg.sender][assetOwners[msg.sender].length-1];
    assetOwners[msg.sender].length--;


  }

  function editAsset(address _assetaddress, string memory _name, string memory _imageurl, string memory _description, uint _price, uint _stock) public {
    removeAsset(_assetaddress);
    listAsset(_name,_imageurl,_description,_price,_stock);
  }


  // Buyer functions - viewing the assets and purchasing the assets

  function viewListing(uint _index) public view returns (address,address, string memory,string memory,string memory,uint,uint){
    require(listingIDs[_index] != address(0), "This product is not available!");
    Listing memory map = listings[listingIDs[_index]];
    return (listingIDs[_index], map.owner,map.name,map.imageurl,map.description, map.price, map.stock) ;

  }



  function purchaseAsset(address _assetaddress) external payable returns (string memory){
    require(_assetaddress != address(0), "This product is not available!");
    require(listings[_assetaddress].stock > 0, "This product has no stock available.");
    require(listings[_assetaddress].available == true, "This product is unavailable.");
    require(msg.sender != listings[_assetaddress].owner, "You cannot purchase your own listing.");
    require(msg.value == listings[_assetaddress].price, "Incorrect price!");
    address(uint160(listings[_assetaddress].owner)).transfer(msg.value);





    emit LogPurchaseAsset(_assetaddress, msg.sender, listings[_assetaddress].name, msg.value);

    --listings[_assetaddress].stock;

    if (listings[_assetaddress].stock == 0){
      listings[_assetaddress].available = false;
    }

  }

  function loadAllAssets() public view returns(address[] memory) {
    return listingIDs;
  }

  function loadMyAssets() public view returns(address[] memory) {
    return(assetOwners[msg.sender]);
  }




}
