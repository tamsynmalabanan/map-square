export default function registerData() {
    Alpine.data('app', () => ({
        get color() {
            return Alpine.store('displaySettings').colorScheme
        },

        init() {
            Alpine.bind(this.$el, {
                ':class': `{
                    'dark': $store.displaySettings.darkModeIsOn,
                    ['h-screen w-screen']: true,
                }`
            })
        }
    }))
    
    Alpine.data('toggleGroup', (open=false) => ({
        open,

        toggle() {
            this.open = !this.open
        },

        close() {
            this.open = false
        }
    }))
}