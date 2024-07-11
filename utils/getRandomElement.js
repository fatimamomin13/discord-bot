module.exports = function getRandomElement(arr) {
    if (Array.isArray(arr) && arr.length > 0) {
        return arr[Math.floor(Math.random() * arr.length)];
    } else {
        console.log("Invalid array");
        return null;
    }
};
