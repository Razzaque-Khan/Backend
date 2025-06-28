const generateStrning = (length) => {
    const string = [];
    const options = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_-";
    for (let i = 0; i < length; i++) {
        Math.floor(Math.random() * 2) ? string.push(options[Math.floor(Math.random() * options.length)].toLowerCase()) : string.push(options[Math.floor(Math.random() * options.length)]);
    }
    return string.join("");
}

console.log(generateStrning(100));