export default function registerStores() {
    Alpine.store('colorScheme', {
        darkMode: Alpine.$persist(null),
    
        toggleDarkMode() {
            this.darkMode = !this.darkMode;
        },
    
        get darkModeIsOn() {
            if (this.darkMode === null) {
                this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            return this.darkMode;
        }
    })
}