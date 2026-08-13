export default function registerStores() {
    Alpine.store('displaySettings', {
        darkMode: Alpine.$persist(window.matchMedia('(prefers-color-scheme: dark)').matches),
        
        toggleDarkMode() {
            const value = !this.darkMode
            this.darkMode = value
            document.dispatchEvent(new CustomEvent("darkModeToggled", {
                detail: { darkMode: value }
            }))
        },
    
        changeColorScheme(color) {
            this.colorScheme = color
        },

        colorScheme: Alpine.$persist('teal'),
        
        colorOptions: {
            'yellow': '#f0b100',
            'teal': '#00bba7',
            'blue': '#2b7fff',
            'pink': '#f6339a',
            'gray': '#6a7282',
        }


        // colors: [
        //     'red', 'orange', 'amber',
        //     'yellow', 'lime', 'green',
        //     'emerald', 'teal', 'cyan',
        //     'sky', 'blue', 'indigo',
        //     'violet', 'purple', 'fuchsia',
        //     'pink', 'rose', 'slate',
        //     'gray', 'zinc', 'neutral',
        //     'stone', 'taupe', 'mauve',
        //     'mist', 'olive',
        // ]
    })
}