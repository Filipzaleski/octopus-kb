

const currentDate = new Date(); 

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];



var dateTime = "Last updated: "
                + (monthNames[currentDate.getMonth()]) +" "+
                + currentDate.getDate() + ", " +
                + currentDate.getFullYear() + " at " +
                + currentDate.getHours() + ":00"  

$('.last-updated-date').html(dateTime)

// API
function fetchData(){
  fetch('https://mainnet-beta.api.drift.trade/competition?key=recn2znI7U4kiZq1A')
  .then(response => {
      if(!response.ok){
          throw Error('ERROR');
      }
      return response.json();
  })
  .then(data => {

const items = data.results
const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
const header = Object.keys(items[0])
const csv = [
  header.join(','), // header row first
  ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
].join('\r\n')
  
const downloadButton = ('#download-button');     
const blob = new Blob([csv], { type: 'text/csv;charset=utf-8,' })
const objUrl = URL.createObjectURL(blob)
const link = document.createElement('a')
link.setAttribute('href', objUrl)
link.setAttribute('download', 'File.csv')
link.setAttribute('class','download-button')
link.textContent = 'Click to Download'

document.querySelector('#download-button-wrapper').append(link)

    
      const html = data.results.map(offer => {
      
          return `
        <div class="table-row">
          <div class="table-cell _1"><div class="rank">${offer.rank + 1}</div></div>
          <div class="table-cell _2"><div class="text-color-grey wallet">${offer.wallet.substring(0, 4)}...${offer.wallet.substr(offer.wallet.length - 4)}</div></div>
          <div class="table-cell _3"><div class="text-color-green">${offer.value.toLocaleString('en-US', {  style: 'currency', currency: 'USD'})}</div></div>
          
        </div>`;
      })
      .join("");

document.querySelector(".table-results.volume").insertAdjacentHTML('afterbegin',  html);
  })
  .catch(error => {
      //console.log(error);
  });
  //console.log("fetch finish");
}
fetchData();





// API volume $
function fetchDataPlnDollar(){
  fetch('https://mainnet-beta.api.drift.trade/competition?key=recsDi3QlfJKhfQ6p')
  .then(response => {
      if(!response.ok){
          throw Error('ERROR');
      }
      return response.json();
  })
  .then(data => {
  

      const htmlPlnDollar = data.results.map(offer => {
      
          return `
        <div class="table-row">
          <div class="table-cell _1"><div class="rank">${offer.rank + 1}</div></div>
          <div class="table-cell _2"><div class="text-color-grey wallet">${offer.wallet.substring(0, 4)}...${offer.wallet.substr(offer.wallet.length - 4)}</div></div>
          <div class="table-cell _3"><div class="text-color-green">${offer.value.toLocaleString('en-US', {  style: 'currency', currency: 'USD'})}</div></div>
          
        </div>`;
      })
      .join("");

document.querySelector(".table-results.pln-dollar").insertAdjacentHTML('afterbegin',  htmlPlnDollar);
  })
  .catch(error => {
      //console.log(error);
  });
  //console.log("fetch finish");
}
fetchDataPlnDollar();



// API volume %
function fetchDataPlnPercent(){
  fetch('https://mainnet-beta.api.drift.trade/competition?key=recsDi3QlfJKhfQ6p')
  .then(response => {
      if(!response.ok){
          throw Error('ERROR');
      }
      return response.json();
  })
  .then(data => {
  

      const htmlPlnPercent = data.results.map(offer => {
      
          return `
        <div class="table-row">
          <div class="table-cell _1"><div class="rank">${offer.rank + 1}</div></div>
          <div class="table-cell _2"><div class="text-color-grey wallet">${offer.wallet.substring(0, 4)}...${offer.wallet.substr(offer.wallet.length - 4)}</div></div>
          <div class="table-cell _3"><div class="text-color-green">${offer.value.toLocaleString('en-US', {  style: 'currency', currency: 'USD'})}</div></div>
          
        </div>`;
      })
      .join("");

document.querySelector(".table-results.pln-percent").insertAdjacentHTML('afterbegin',  htmlPlnPercent);
  })
  .catch(error => {
      //console.log(error);
  });
  //console.log("fetch finish");
}
fetchDataPlnPercent();
