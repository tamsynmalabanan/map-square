export default function registerStores() {
    Alpine.store('displaySettings', {
        darkMode: Alpine.$persist(null),
    
        toggleDarkMode() {
            this.darkMode = !this.darkMode;
        },
    
        get darkModeIsOn() {
            if (this.darkMode === null) {
                this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            return this.darkMode;
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