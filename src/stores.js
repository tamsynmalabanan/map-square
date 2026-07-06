export default function registerStores() {
    Alpine.store('darkMode', {
        on: Alpine.$persist(null).as('darkModeIsOn'),
    
        toggle() {
            this.on = !this.isOn;
        },
    
        get isOn() {
            if (this.on === null) {
                this.on = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            return this.on;
        }
    })
}