import * as Cesium from 'cesium';
import { MARS_ELLIPSOID } from '../../app/marsEllipsoid.js';

export function createMarsHillshadeLayer({ viewer }) {
  let visible = false;
  let opacity = 0.5;

  return {
    id: 'mars-hillshade',
    name: 'Analytical Hillshade (High-Res)',
    setDestinationRelief: () => {},
    show: () => {
      visible = true;
    },
    hide: () => {
      visible = false;
    },
    setOpacity: (val) => {
      opacity = Math.max(0.0, Math.min(1.0, val));
    },
    getOpacity: () => opacity,
    isVisible: () => visible,
    destroy: () => {},
  };
}

