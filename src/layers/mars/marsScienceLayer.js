import * as Cesium from 'cesium';
import { MARS_ELLIPSOID } from '../../app/marsEllipsoid.js';

export function createMarsScienceLayer({ viewer, onSelectTarget }) {
  let billboardCollection = null;
  let visible = true;
  let opacity = 1.0;
  let targets = [];

  const scene = viewer.scene;
  billboardCollection = scene.primitives.add(new Cesium.BillboardCollection());

  // Fetch science targets
  fetch('/api/mars/features')
    .then((r) => r.json())
    .then((data) => {
      targets = (data?.features || []).filter(
        (f) => f.properties?.category === 'science_target' || f.properties?.category === 'base_camp'
      );

      for (const f of targets) {
        const [lon, lat] = f.geometry.coordinates;
        const pos = Cesium.Cartesian3.fromDegrees(lon, lat, 35.0, MARS_ELLIPSOID);

        const isBase = f.properties.category === 'base_camp';

        billboardCollection.add({
          position: pos,
          image: isBase ? createBasePinCanvas() : createScienceHexCanvas(),
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          id: f,
        });
      }
    })
    .catch((err) => {
      console.warn('[Mars Science] Failed to load features:', err);
    });

  // Screen space handler for entity picking
  const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  handler.setInputAction((click) => {
    const picked = scene.pick(click.position);
    if (picked && picked.id && picked.id.properties) {
      if (onSelectTarget) {
        onSelectTarget(picked.id.properties);
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  return {
    id: 'mars-science',
    name: 'Science Targets (Perseverance / CRISM)',
    show: () => {
      visible = true;
      if (billboardCollection) billboardCollection.show = true;
    },
    hide: () => {
      visible = false;
      if (billboardCollection) billboardCollection.show = false;
    },
    setOpacity: (val) => {
      opacity = Math.max(0.0, Math.min(1.0, val));
    },
    getOpacity: () => opacity,
    isVisible: () => visible,
    destroy: () => {
      handler.destroy();
      if (billboardCollection && !viewer.isDestroyed()) {
        scene.primitives.remove(billboardCollection);
      }
    },
  };
}

function createBasePinCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 38;
  canvas.height = 38;
  const ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.arc(19, 19, 16, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(11, 61, 145, 0.9)';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#00d2ff';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', 19, 19);

  return canvas;
}

function createScienceHexCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 40;
  canvas.height = 40;
  const ctx = canvas.getContext('2d');

  const cx = 20, cy = 20, r = 15;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(126, 34, 206, 0.85)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#c084fc';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(18, 11);
  ctx.lineTo(22, 11);
  ctx.lineTo(22, 15);
  ctx.lineTo(26, 23);
  ctx.arcTo(27, 26, 24, 26, 2);
  ctx.lineTo(16, 26);
  ctx.arcTo(13, 26, 14, 23, 2);
  ctx.lineTo(18, 15);
  ctx.closePath();
  ctx.fill();

  return canvas;
}
