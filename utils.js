const createListItemTemplate = (item) => `<li class="item">
    <label>
        <input type="checkbox" class="js-item-checkbox" value='${JSON.stringify(item)}'>
        <span>${item.fileName}</span>
    </label>
</li>`;

const getFileNameFromPath = (path) => {
    let strArray = path.split('/');
    // in case if it's win path
    if (strArray.length === 1) {
        strArray = path.split('\\');
    }
    if (strArray.length > 1) {
        return strArray[strArray.length - 1];
    }
    return path;
}


module.exports = {
    createListItemTemplate,
    getFileNameFromPath,
}