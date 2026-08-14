import { invert, parseInt } from "lodash"

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
    
    Alpine.data('toggleGroup', ({openKey='open', openValue=false}={}) => ({
        [openKey]: openValue,

        init() {
            this.$watch(openKey, value => {
                this.$dispatch('toggled', { open: value })
            })
        },

        toggle() {
            this[openKey] = !this[openKey]
        },

        close() {
            this[openKey] = false
        }
    }))
    
    Alpine.data('accordionGroup', ({activeKey='active', activeValue=-1}={}) => ({
        [activeKey]: parseInt(activeValue),

        init() {
            this.$watch(activeKey, value => {
                this.$dispatch('toggled', { active: value })
            })
        },

        toggle(value) {
            const intValue = parseInt(value)
            this[activeKey] = this.isActive(intValue) ? -1 : intValue
        },

        isActive(value) {
            return (this[activeKey] || parseInt(activeValue)) === parseInt(value)
        }
    }))
    
    Alpine.data('dynamicBtn', ({activeKey='active', activeValue=false}) => ({
        [activeKey]: activeValue,

        init() {
            this.$watch(activeKey, value => {
                this.$dispatch('toggled', { active: value })
            })
        },

        toggle() {
            this[activeKey] = !this[activeKey]
        },

        activate() {
            this[activeKey] = true
        },

        deactivate() {
            this[activeKey] = false
        }
    }))
}