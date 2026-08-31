import { invert, parseInt } from "lodash"

export default function registerData() {
    Alpine.data('app', () => ({
        get color() {
            return Alpine.store('displaySettings').colorTheme
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
        key: key,

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
        
        openCollapse({targetKey=key}={}) {
            if (targetKey !== key) return
            this[key] = false
        },
        
        closeCollapse({targetKey=key}={}) {
            if (targetKey !== key) return
            this[key] = true
        },
    }))
    
    Alpine.data('accordionGroup', ({key='section', value=null}={}) => ({
        key: key,

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
        
        isActiveSection(value, {targetKey=key}={}) {
            if (targetKey !== key) return
            return this[key] === value
        }
    }))
    
    Alpine.data('highlightButton', ({key='highlight', value=false}={}) => ({
        key: key,

        [key]: value,

        previousValue: !value,

        init() {
            this.$watch(key, value => {
                if (value === this.previousValue) return
                this.$dispatch('highlightToggled', {key, value})
            })
        },

        toggleHighlight({targetKey=key}={}) {
            if (targetKey !== key) return
            this.previousValue = this[key]
            this[key] = !this[key]
        },
    }))

    Alpine.data('radioGroup', ({key='value', value=null}={}) => ({
        key: key,

        [key]: value,

        previousValue: null,

        init() {
            this.$watch(key, value => {
                if (value === this.previousValue) return
                this.$dispatch('radioToggled', {key, value})
            })
        },

        toggleRadio(value, {targetKey=key}={}) {
            if (targetKey !== key) return
            this.previousValue = this[key]
            this[key] = value
        },

        isRadioValue(value2, {targetKey=key}={}) {
            if (targetKey !== key) return
            return (this[key] || value) === value2
        }
    }))
}