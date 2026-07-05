export const templateToElement = (template, parent) => {
    const div = document.createElement('div');
    div.innerHTML = template.trim();
    return div.firstElementChild;
}

export const randomId = (prefix=undefined, suffix=undefined) => {
    return Array(
        prefix, 
        Math.random().toString(36).substr(2, 9), 
        suffix
    ).filter(Boolean).join('-')
}