App = {
    web3Provider: null,
    contracts: {},
    account: 0X0,
    loading: false,




    init: async () => {
        return App.initWeb3();
        App.reloadAssets;
    },

    initWeb3: async () => {
        if(window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            try {
                await window.ethereum.enable();
                App.displayAccountInfo();
                return App.initContract();
            } catch(error) {
                //user denied access
                console.error("Unable to retrieve your accounts! You have to approve this application on Metamask");
            }
        } else if(window.web3) {
            window.web3 = new Web3(web3.currentProvider || "ws://localhost:8545");
            App.displayAccountInfo();
            return App.initContract();
        } else {
            //no dapp browser
            console.log("Non-ethereum browser detected. You should consider trying Metamask");
        }
    },

    displayAccountInfo: async () => {
        const accounts = await window.web3.eth.getAccounts();
        App.account = accounts[0];
        $('#account').text(App.account);
        const balance = await window.web3.eth.getBalance(App.account);
        $('#accountBalance').text(window.web3.utils.fromWei(balance, "ether") + " ETH");
    },

    initContract: async () => {
        $.getJSON('EthBay.json', ethBayArtifact => {
            App.contracts.EthBay = TruffleContract(ethBayArtifact);
            App.contracts.EthBay.setProvider(window.web3.currentProvider);
            return App.reloadAssets();
        });
    },

    editAsset: async () => {
      const _assetId = $(this).attr('data-id');
      console.log(_assetId);
      const assetPriceValue = parseFloat($('#asset_price_edit').val());
      const assetPrice = isNaN(assetPriceValue) ? "0" : assetPriceValue.toString();
      const _name = $('#asset_name_edit').val();
      const _imageurl = $('#asset_url_edit').val();
      const assetStockValue = parseFloat($('#asset_stock_edit').val());
      const _stock = isNaN(assetStockValue) ? "0" : assetStockValue.toString();
      const _price = window.web3.utils.toWei(assetPrice, "ether");
      const _description = $('#asset_description_edit').val();
      try {
          const ethBayInstance = await App.contracts.EthBay.deployed();
          const transactionReceipt = await ethBayInstance.editAsset(
              _assetId,
              _name,
              _imageurl,
              _description,
              _price,
              _stock,
               {
                  from: App.account,
                  value: _price,
                  gas: 500000
              }
          ).on("transactionHash", hash => {
              console.log("transaction hash", hash);
          });
          console.log("transaction receipt", transactionReceipt);
      } catch(error) {
          console.error(error);
          console.log(_assetId);
      }
    },

    // Listen to events raised from the contract

    sellAsset: async () => {
        const assetPriceValue = parseFloat($('#asset_price').val());
        const assetPrice = isNaN(assetPriceValue) ? "0" : assetPriceValue.toString();
        const _name = $('#asset_name').val();
        const _imageurl = $('#asset_url').val();
        const assetStockValue = parseFloat($('#asset_stock').val());
        const _stock = isNaN(assetStockValue) ? "0" : assetStockValue.toString();
        const _description = $('#asset_description').val();

        const _price = window.web3.utils.toWei(assetPrice, "ether");
        if(_name.trim() == "" || _price === "0") {
            return false;
        }
        try {
            const ethBayInstance = await App.contracts.EthBay.deployed();
            const transactionReceipt = await ethBayInstance.listAsset(
                _name,
                _imageurl,
                _description,
                _price,
                _stock,
                {from: App.account, gas: 5000000}
            ).on("transactionHash", hash => {
                console.log("transaction hash", hash);
            });
            console.log("transaction receipt", transactionReceipt);
        } catch(error) {
            console.error(error);
        }
    },

    purchaseAsset: async () => {
      event.preventDefault()
        var _assetId = $(event.target).data('id');
        const assetPriceValue = parseFloat($(event.target).data('value'));
        const assetPrice = isNaN(assetPriceValue) ? "0" : assetPriceValue.toString();
        const _price = window.web3.utils.toWei(assetPrice, "ether");
        try {
            const ethBayInstance = await App.contracts.EthBay.deployed();
            const transactionReceipt = await ethBayInstance.purchaseAsset(
                _assetId, {
                    from: App.account,
                    value: _price,
                    gas: 500000
                }
            ).on("transactionHash", hash => {
                console.log("transaction hash", hash);
            });
            console.log("transaction receipt", transactionReceipt);
            console.log(_assetId);
        } catch(error) {
            console.error(error);

        }
    },


    reloadAssets: async () => {
        // avoid reentry
        if (App.loading) {
            return;
        }
        App.loading = true;

        // refresh account information because the balance may have changed
        App.displayAccountInfo();
        const ethBayInstance = await App.contracts.EthBay.deployed();

        if(window.location.pathname == "/myassets.html") {
          console.log(window.location.pathname);
          const assetIds = await ethBayInstance.loadMyAssets({from: App.account});
          $('#assetsRowMyAssets').empty();
          for(let i = 0; i < assetIds.length; i++) {
              const asset = await ethBayInstance.viewListing(i);
              console.log("");
              App.displayAssetMyAssets(asset[0], asset[1], asset[2], asset[3], asset[4], asset[5], asset[6]);
          }
          App.loading = false;
        } else {
          const assetIds = await ethBayInstance.loadAllAssets({from: App.account});
          $('#assetsRowIndex').empty();
          for(let i = 0; i < assetIds.length; i++) {
              const asset = await ethBayInstance.viewListing(i);
              console.log("");
              App.displayAssetIndex(asset[0], asset[1], asset[2], asset[3], asset[4], asset[5], asset[6]);
          }
        }
        try {
            1 == 1;

        } catch(error) {
            console.error(error);
            App.loading = false;
        }
    },

    displayAssetIndex: (id, seller, name, imageurl,description, price,stock) => {
        // Retrieve the asset placeholder
        const assetsRow = $('#assetsRowIndex');
        const etherPrice = web3.utils.fromWei(price, "ether");

        // Retrieve and fill the asset template
        var assetTemplate = $('#assetTemplate');
        assetTemplate.find('.panel-title').text(name);

        var img = document.createElement("img");
        img.src = imageurl;
        var src = document.getElementById("header");
        src.appendChild(img);

        assetTemplate.find('.asset-description').text(description);
        assetTemplate.find('.asset-price').text(etherPrice + " ETH");
        assetTemplate.find('.btn-buy').attr('data-id', id);
        assetTemplate.find('.btn-buy').attr('data-value', etherPrice);

        // seller?
        if (seller == App.account) {
            assetTemplate.find('.asset-seller').text("You");
            assetTemplate.find('.btn-buy').hide();
        } else {
            assetTemplate.find('.asset-seller').text(seller);
            assetTemplate.find('.btn-buy').show();
        }

        if (stock == 0) {
          assetTemplate.find('.asset-stock').text("Out of Stock");
          assetTemplate.find('.btn-buy').hide();
        } else {
          assetTemplate.find('.asset-stock').text(stock + " Units");
          assetTemplate.find('.btn-buy').show();
        }

        // add this new asset
        assetsRow.append(assetTemplate.html());

    },


    displayAssetMyAssets: (id, seller, name, imageurl,description, price,stock) => {
        // Retrieve the asset placeholder
        const assetsRow = $('#assetsRowMyAssets');
        const etherPrice = web3.utils.fromWei(price, "ether");

        // Retrieve and fill the asset template
        var assetTemplate = $('#assetTemplate');
        assetTemplate.find('.panel-title').text(name);
        assetTemplate.find('.id').attr(id);
        var img = document.createElement("img");
        img.src = imageurl;
        var src = document.getElementById("header");
        src.appendChild(img);

        assetTemplate.find('.asset-description').text(description);
        assetTemplate.find('.asset-price').text(etherPrice + " ETH");
        assetTemplate.find('.btn-edit').attr('data-id', id);
        assetTemplate.find('.btn-edit').show();
        var appendAsset = true;
        // seller?
        if (seller == App.account) {
            assetTemplate.find('.asset-seller').text("You");
        } else {
            appendAsset = false;
        }

        if (stock == 0) {
          assetTemplate.find('.asset-stock').text("Out of Stock");
        } else {
          assetTemplate.find('.asset-stock').text(stock + " Units");
        }

        // add this new asset
        if (appendAsset != false){
          assetsRow.append(assetTemplate.html());
        };

    },




};




$(function () {
    $(window).load(function () {
        App.init();
    });
});
