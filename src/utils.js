export const templateToElement = (template) => {
    const div = document.createElement('div');
    div.innerHTML = template.trim();
    return div.firstElementChild;
}