import { isObject } from '@turf/turf';
import maplibregl from 'maplibre-gl';

const defaultControls = {
    nav: {
        params: {
            active: true,
            position: 'top-left',
            order: 2,
            options: {
                visualizePitch: true,
                showZoom: true,
                showCompass: true,
            },
        },
        constructor: maplibregl.NavigationControl,
        handler: (control) => {
            const container = control._container

            const btnBgExp = `'bg-'+color+'-50/100! dark:bg-'+color+'-950/100! hover:bg-'+color+'-500/50!'`

            const zoomInBtn = container.querySelector('.maplibregl-ctrl-zoom-in')
            zoomInBtn.innerHTML = icons.plusMini
            zoomInBtn.setAttribute(':class', `
                {[${btnBgExp}]: true}
            `)
            zoomInBtn.classList.add('grid', 'place-items-center', 'rounded-t', 'dark:text-white')

            const zoomOutBtn = container.querySelector('.maplibregl-ctrl-zoom-out')
            zoomOutBtn.innerHTML = icons.minusMini
            zoomOutBtn.setAttribute(':class', `
                {[${btnBgExp}]: true}
                `)
                zoomOutBtn.classList.add('grid', 'place-items-center', 'dark:text-white', 'dark:border-gray-50/10!')
                
            const compassBtn = control._container.querySelector('.maplibregl-ctrl-compass')
            compassBtn.setAttribute(':class', `
                {[${btnBgExp}]: true}
            `)
            compassBtn.classList.add('grid', 'place-items-center', 'rounded-b', 'dark:text-white', 'dark:border-gray-50/10!')
        }
    },
}

export default class HandleControls {
    constructor(map) {
        this.map = map
        this.addControls()
    }

    addControls() {
        this.removeControls()

        this.map._ms.controls = Object.fromEntries(
            Object.entries(defaultControls).map(([name, props]) => {
                const params = this.map._ms.theme.settings.controls[name] ??= props.params
                return [name, {...props, params}]
            }).sort((a, b) => a[1].params.order - b[1].params.order).map(([name, props]) => {
                const params = props.params
                if (!params.active) return
            
                const control = new props.constructor(params.options)
                this.map.addControl(control, params.position)

                props.handler?.(control)

                return [name, control]
            }).filter(Boolean)
        )
    }

    removeControls() {
        if (Object.keys(this.map._ms.controls).length === 0) return
        
        Object.values(this.map._ms.controls).forEach(control => {
            this.map.removeControl(control)
        })

        this.map._ms.controls = {}
    }
}