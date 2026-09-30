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
    
        changeColorTheme(color) {
            this.colorTheme = color
            document.dispatchEvent(new CustomEvent("colorSchemeChanged", {
                detail: { color }
            }))
        },

        colorTheme: Alpine.$persist('teal'),
        
        colorOptions: {
            'yellow': {
                200: '#fff085',
                600: '#d08700',
                950: '#432004'
            },
            'teal': {
                200: '#96f7e4',
                600: '#009689',
                950: '#022f2e'
            },
            'blue': {
                200: '#bedbff',
                600: '#155dfc',
                950: '#162556'
            },
            'pink': {
                200: '#fccee8',
                600: '#e60076',
                950: '#510424'
            },
            'gray': {
                200: '#e5e7eb',
                600: '#4a5565',
                950: '#030712'
            },
        },

        get hexColor() {
            return this.colorOptions[this.colorTheme]
        },

        get hslaColor() {
            return utils.hslaColor(utils.hexToHSLA(this.hexColor))   
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