// dataStore.js
let qrData = '';

function setQRData(data) {
    qrData = data;
}

function getQRData() {
    return qrData;
}

module.exports = {
    setQRData,
    getQRData
};
