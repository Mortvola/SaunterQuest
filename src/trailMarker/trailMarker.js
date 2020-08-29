import L from 'leaflet';
import { metersToMilesRounded } from '../utilities';

class TrailMarker {
    constructor(map, iconUrl) {
        this.map = map;

        this.iconUrl = iconUrl;

        this.icon = this.createIcon();

        this.marker = new L.Marker([],
            {
                contextmenu: true,
                contextmenuItems: [],
                icon: this.icon,
            });

        this.marker.bindPopup(
            () => {
                let message = this.infoMessage();

                if (this.infoMessageCallback) {
                    message += this.infoMessageCallback();
                }

                return message;
            },
        );
    }

    createIcon(label) {
        return L.divIcon(
            {
                className: 'trail-marker',
                html: `<div class="trail-marker-label">${label || ''}</div><img src="${this.iconUrl}">`,
                iconAnchor: L.point(16, 32),
                popupAnchor: L.point(0, -32),
                tooltipAnchor: L.point(0, -32),
            },
        );
    }

    addListener() {
        this.marker.off('click');

        this.marker.on('click', () => {
            if (!controlDown) {
                this.marker.openPopup();
            }
        });
    }

    removeListener() {
        this.marker.off('click');
    }

    setDraggable(draggable, listener) {
        if (draggable) {
            const trailMarker = this;

            this.dragListener = this.marker.on('dragend', () => {
                if (listener) {
                    listener(trailMarker);
                }
            });
        }

        this.marker.options.draggable = draggable;
    }

    setPosition(position) {
        if (position !== undefined) {
            this.meters = position.dist;
            this.ele = position.ele;
            this.marker.setLatLng(position);
            this.marker.addTo(this.map);

            this.addListener();
        }
    }

    getPosition() {
        return this.marker.getLatLng();
    }

    removeMarker() {
        this.marker.remove();
        this.removeListener();
    }

    infoMessage() {
        return this.getCommonInfoDivs();
    }

    setInfoMessageCallback(callback) {
        this.infoMessageCallback = callback;
    }

    getCommonInfoDivs() {
        const position = this.marker.getLatLng();

        return `<div>Mile: ${metersToMilesRounded(this.meters)
        }</div><div>Elevation: ${metersToFeet(this.ele)}\'</div>`
            + `<div>Lat: ${position.lat}</div>`
            + `<div>Lng: ${position.lng}</div>`;
    }

    setContextMenu(contextMenu) {
        // this.marker.bindContextMenu({ contextmenu: true, contextmenuItems: contextMenu });
    }

    setIcon(iconUrl) {
        this.marker.setIcon(
            L.icon(
                {
                    iconUrl,
                    iconAnchor: L.point(16, 32),
                    popupAnchor: L.point(0, -32),
                    tooltipAnchor: L.point(0, -32),
                },
            ),
        );
    }

    setLabel(label) {
        this.icon = this.createIcon(label);

        this.marker.setIcon(this.icon);

        this.label = label;
    }

    getLabel() {
        return this.label;
    }
}

export default TrailMarker;
