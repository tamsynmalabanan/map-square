export default function registerData() {
    Alpine.data('app', () => ({
        get color() {
            return Alpine.store('displaySettings').colorScheme
        },

        init() {
            Alpine.bind(this.$el, {
                ':class': `{
                    'dark': $store.displaySettings.darkMode,
                    ['h-screen w-screen']: true,
                }`
            })
        }
    }))
    
    Alpine.data('toggleGroup', (open=false) => ({
        open,

        init() {
            this.$watch('open', value => {
                this.$dispatch('toggled', { open: value })
            })
        },

        toggle() {
            this.open = !this.open
        },

        close() {
            this.open = false
        }
    }))
    
    Alpine.data('dynamicBtn', (active=false) => ({
        active,

        init() {
            this.$watch('active', value => {
                this.$dispatch('toggled', { active: value })
            })
        },

        toggle() {
            this.active = !this.active
        },

        activate() {
            this.active = true
        },

        deactivate() {
            this.active = false
        }
    }))
}