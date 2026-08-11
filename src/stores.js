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

        colorOptions: [
            'yellow',
            'teal',
            'blue',
            'pink',
            'gray',
        ]

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