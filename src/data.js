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
    
    Alpine.data('collapseGroup', ({key='collapsed', value=true}={}) => ({
        [key]: value,

        init() {
            this.$watch(key, value => {
                this.$dispatch('collapseToggled', {key, value})
            })
        },

        toggleCollapse({targetKey=key}={}) {
            if (targetKey !== key) return
            this[key] = !this[key]
        },
        
        closeCollapse({targetKey=key}={}) {
            if (targetKey !== key) return
            this[key] = true
        }
    }))
    
    Alpine.data('accordionGroup', ({key='section', value=null}={}) => ({
        [key]: value,

        init() {
            this.$watch(key, value => {
                this.$dispatch('accordionToggled', {key, value})
            })
        },

        toggleAccordion(value, {targetKey=key}={}) {
            if (targetKey !== key) return
            this[key] = this.isActiveSection(value) ? null : value
        },

        isActiveSection(value2, {targetKey=key}={}) {
            if (targetKey !== key) return
            return (this[key] || value) === value2
        }
    }))
    
    Alpine.data('highlightButton', ({key='highlight', value=false}={}) => ({
        [key]: value,

        init() {
            this.$watch(key, value => {
                this.$dispatch('highlightToggled', {key, value})
            })
        },

        toggleHighlight({targetKey=key}={}) {
            if (targetKey !== key) return
            this[key] = !this[key]
        },

        activate({targetKey=key}={}) {
            if (targetKey !== key) return
            this[key] = true
        },

        deactivate({targetKey=key}={}) {
            if (targetKey !== key) return
            this[key] = false
        }
    }))

    Alpine.data('radioGroup', ({key='value', value=null}={}) => ({
        [key]: value,

        init() {
            this.$watch(key, value => {
                this.$dispatch('radioToggled', {key, value})
            })
        },

        toggleRadio(value, {targetKey=key}={}) {
            if (targetKey !== key) return
            this[key] = value
        },

        isRadioValue(value2, {targetKey=key}={}) {
            if (targetKey !== key) return
            return (this[key] || value) === value2
        }
    }))
}