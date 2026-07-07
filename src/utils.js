export const strToEl = (str) => {
    const div = document.createElement('div');
    div.innerHTML = str.replace(/\s{2,}/g, ' ').trim();
    return div.firstElementChild;
}

export const objToStr = (obj) => {
    return JSON.stringify(obj).replace(/"/g, '&quot;')
}