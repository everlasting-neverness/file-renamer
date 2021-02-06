const createListItemTemplate = (item) => `<li class="item">
    <label class="item-label">
        <input type="checkbox" class="js-item-checkbox" value="${item}">
        <span class="item-title">${item}</span>
    </label>
</li>`;

const getFileNameFromPath = (path) => {
    const strArray = path.split('.');
    if (strArray.length > 1) {
        return strArray[strArray.length - 1];
    }
    return path;
}

module.exports = {
    createListItemTemplate,
    getFileNameFromPath,
}