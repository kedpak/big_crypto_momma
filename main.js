let web3 = new Web3(new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws/v3/6f76a43633394ec7962642d7737ca159"));
let KittiesContract;
const contractAddr = '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d';

$(document).ready(async function() {
    await window.ethereum.enable().then((accounts) => {
        KittiesContract = new web3.eth.Contract(abi, contractAddr);
    });
    $("#submit-button").click(findBigKitty);
});

createResultList = (kittyData) => {
    let list = $("#result-list");
    let listItem = $("<li></li>");
    let birthTime = $(`<p>BirthTime: ${kittyData.birthTime}</p>`);
    let generation = $(`<p>Generation: ${kittyData.generation}</p>`);
    let genes = $(`<p>Genes: ${kittyData.genes}</p>`);

    listItem.append(birthTime).before("<br >");
    listItem.append(generation).before("<br >");
    listItem.append(genes).before("<br >");

    list.append(listItem);
    $("body").removeClass("loading");
}

// Function which finds the kitty (matron) with the largest amount of births, within the block range. 
findBigKitty = async() => {
    $("body").addClass("loading");
    let startBlock = parseInt($("#start-input").val());
    let endBlock = parseInt($("#end-input").val());

    // will call 500 blocks at a time as Infura will throw error if event return amount is greater than 10,000.
    let blockIter1 = 0; // Beginning of call range
    let blockIter2 = 500; // end of call range
    let resultAr = [];
    //let kitties = {};

    // Get all events related to kitty birth in input range in 500 increments
    while (startBlock + blockIter2 <= endBlock) {
        await KittiesContract.getPastEvents('Birth', { fromBlock: startBlock + blockIter1, toBlock: startBlock + blockIter2 }).then((res) => {
            console.log('res ', res);
            resultAr = resultAr.concat(res);
        }).catch((err) => {
            console.log("err ", err);
        });

        if ((startBlock + blockIter2) === endBlock) {
            break;
        } else {
            blockIter1 += 501;
            blockIter2 += 500;
            // Handle if range goes above the end block number
            if (startBlock + blockIter2 > endBlock) {
                startBlock = endBlock;
                blockIter2 = 0;
                console.log(" startBlock + blockIter2 ", startBlock + blockIter2)
            }
        }
    }

    // Place all kitties inside of kitties object, and iterate count by one for each kitty who's matronId already exists in the obj.
    let kitties = resultAr.reduce((kitties, kitty) => {
        // If matrond id exists in obj, iterate by one. This is how we will find largest kitty mom. 
        if (kitties.hasOwnProperty(kitty['returnValues']['matronId'])) {
            kitties[kitty['returnValues']['matronId']]++;
        }
        console.log('test')
        kitties[kitty['returnValues']['kittyId']] = 0;
        return kitties;
    }, {});


    let bigMommaIds = [];
    let biggest = 0;
    let allKitties = Object.entries(kitties);

    // Find kitties with highest matronId count. Handles if there is more than one. 
    for (const [id, count] of allKitties) {
        if (count > biggest) {
            bigMommaIds = [];
            bigMommaIds.push(id);
            biggest = count;
        } else if (count === biggest) {
            bigMommaIds.push(id);
        }
    }
    $("#result-count").empty();
    $("#result-list").empty();
    $("#result-count").append(`There were ${resultAr.length} amount of Births in that range!`);

    bigMommaIds.forEach((id) => {
        KittiesContract.methods.getKitty(id).call().then((res) => {
            createResultList(res);
        })
    });
}